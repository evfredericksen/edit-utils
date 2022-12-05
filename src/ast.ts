import * as vscode from "vscode"
import * as dsl from "./dsl"
import { sliceArray } from "./util";

export let parseTreeExtensionExports: object | null = null

export async function setup() {
    const parseTreeExtension = vscode.extensions.getExtension("pokey.parse-tree");
    if (parseTreeExtension === undefined) {
        throw new Error("Depends on pokey.parse-tree extension");
    }
    parseTreeExtensionExports = await parseTreeExtension.activate()
}

type UnNormalizedCondition = string | Array<UnNormalizedCondition> | undefined | null | ((node: TreeNode) => boolean)
type NormalizedCondition = (node: TreeNode) => boolean

function normalizeCondition(condition: UnNormalizedCondition): NormalizedCondition {
    if (Array.isArray(condition)) {
        const childFns: NormalizedCondition[] = condition.map(x => normalizeCondition(x))
        return (node: TreeNode) => {
            for (const fn of childFns) {
                if (!fn(node)) {
                    return false;
                }
            }
            return true;
        }
    }
    if (condition === null || condition === undefined) {
        return (node: TreeNode) => true
    }
    if (typeof condition === "string") {
        return (node: TreeNode) => node.type === condition
    }
    return condition
}

export function dump(node: TreeNode): any {
    const type = node.type
    if (node.parent) {
        console.log(`${node.parent.type} => ${type}`)
    }
    else {
        console.log(type)
    }
    console.log(node.text)
    console.log('--------------------')
    for (const child of node.children) {
        dump(child)
    }
}

export function* walk(node: TreeNode): Generator<TreeNode> {
    yield node;
    for (const child of node.children) {
        for (const desc of walk(child)) {
            yield desc
        }
    }
}

export function* walkChildrenFirst(node: TreeNode): Generator<TreeNode> {
    for (const child of node.children) {
        for (const desc of walkChildrenFirst(child)) {
            yield desc
        }
    }
    yield node;
}

export function* walkParents(node: TreeNode): Generator<TreeNode> {
    let curr: TreeNode | null = node.parent;
    while (curr !== null) {
        yield curr
        curr = curr.parent
    }
}

export function search(root: TreeNode, condition: UnNormalizedCondition) {
    condition = normalizeCondition(condition)
    for (const node of walk(root)) {
        if (condition(node)) {
            return node
        }
    }
    return null
}

export function searchFromPosition(
    position: vscode.Position,
    root: TreeNode,
    direction: "up" | "down" | "before" | "after",
    condition: UnNormalizedCondition,
    selector: dsl.Selector,
    count = 1,
): TreeNode[] {
    const node = findNodeAtPosition(position, root)
    if (node === null) {
        return []
    }
    let iterFn: any;
    if (direction === "up") {
        iterFn = walkParents.bind(undefined, node)
        const toCheck = [node].concat(Array.from(walkParents(node))).slice(0, -1)
        let highestMatches: TreeNode[] = []
        for (let parent of toCheck) {
            const matches = matchSingleNode(parent, selector)
            if (matches.length > 0) {
                highestMatches = matches
            }
        }
        return highestMatches
    }
    else if (direction === "down") {
        iterFn = walk.bind(undefined, node)
    }
    else if (direction === "before") {
        condition = [condition, (node: TreeNode) => position.isBefore(vscodePositionFromNodePosition(node.startPosition))]
        iterFn = walk.bind(undefined, root)
    }
    else { // after
        condition = [condition, (node: TreeNode) => position.isAfter(vscodePositionFromNodePosition(node.endPosition))]
        iterFn = walk.bind(undefined, root)
    }
    return [];
}

function findNodeAtPosition(position: vscode.Position, root: TreeNode) {
    for (const node of walkChildrenFirst(root)) {
        if (doesNodeContainPosition(node, position)) {
            return node
        }
    }
    return null
}

// function matchNode(node: TreeNode, selector: dsl.Selector) {
//     return dsl.isMultiple(selector) ? matchMultipleNodes(node, selector) : matchSingleNode(node, selector)
// }

function matchSingleNode(node: TreeNode, selector: dsl.Selector): TreeNode[] {
    // dictionary.pair[]
    // dictionary.pair[2]
    // dictionary.pair.value
    let matches: TreeNode[] = []
    let isMatch = selector.isWildcard || selector.name === node.type
    const childSelector = selector.child
    const isLeaf = childSelector === null
    if (isMatch) {
        if (isLeaf) {
            matches.push(node)
        }
        else {
            const childIsMultiple = dsl.isMultiple(childSelector)
            if (childIsMultiple) {
                matches = matchMultipleNodes(node, selector, childSelector)
            }
            else {
                for (const child of node.children) {
                    const childResult = matchSingleNode(child, childSelector);
                    if (childResult.length > 0) {
                        return [...childResult]
                    }
                }
            }
        }
    }
    else if (selector.isOptional && !isLeaf) {
        return matchSingleNode(node, childSelector)
    }
    return matches
}

function matchMultipleNodes(parent: TreeNode, parentSelector: dsl.Selector, childSelector: dsl.Selector): TreeNode[] {
    // index and slice logic should go here I think
    let matches: TreeNode[] = []
    for (const node of parent.children) {
        const nodeMatches = matchSingleNode(node, childSelector)
        matches = matches.concat(nodeMatches)
    }
    if (childSelector.index) {
        const index = childSelector.index < 0 ? matches.length - 1 + childSelector.index : childSelector.index
        matches = [matches[index]]
    }
    if (childSelector.slice) {
        const slice = childSelector.slice
        matches = sliceArray(matches, slice.start, slice.stop, slice.step)
    }
    return matches
}

function vscodePositionFromNodePosition(nodePosition: { row: number, column: number }) {
    return new vscode.Position(nodePosition.row, nodePosition.column)
}

function doesNodeContainPosition(node: TreeNode, position: vscode.Position) {
    const nodeStartPosition = vscodePositionFromNodePosition(node.startPosition)
    const nodeEndPosition = vscodePositionFromNodePosition(node.endPosition)
    return position.isAfterOrEqual(nodeStartPosition) && position.isBeforeOrEqual(nodeEndPosition)
}

export function selectionFromTreeNode(node: TreeNode, reverse = false): vscode.Selection {
    const startPosition = vscodePositionFromNodePosition(node.startPosition)
    const endPosition = vscodePositionFromNodePosition(node.endPosition)
    if (reverse) {
        return new vscode.Selection(endPosition, startPosition)
    }
    return new vscode.Selection(startPosition, endPosition)
}

export function selectionFromNodeArray(nodes: TreeNode[], reverse = false) {
    let anchor: vscode.Position | null = null
    let active: vscode.Position | null = null
    for (const node of nodes) {
        const startPosition = vscodePositionFromNodePosition(node.startPosition)
        const endPosition = vscodePositionFromNodePosition(node.endPosition)
        if (reverse) {
            if (anchor === null || endPosition.isAfter(anchor)) {
                anchor = endPosition
            }
            if (active === null || startPosition.isBefore(active)) {
                active = startPosition
            }
        }
        else {
            if (anchor === null || startPosition.isBefore(anchor)) {
                anchor = startPosition
            }
            if (active === null || endPosition.isAfter(active)) {
                active = endPosition
            }
        }
    }
    if (anchor === null || active === null) {
        throw new Error("At least one node is required for a selection")
    }
    return new vscode.Selection(anchor, active)
}