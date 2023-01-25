type JSONValue =
    | string
    | number
    | boolean
    | null
    | JSONValue[]
    | { [key: string]: JSONValue }

interface JSONObject {
    [k: string]: JSONValue
}
interface JSONArray extends Array<JSONValue> { }

type RequestBase = {
    jsonrpc: "2.0"
    method: string
    params?: JSONValue
    id: string
}

type PingRequest = RequestBase & {
    method: "PING"
}

type SelectInSurroundRequest = RequestBase & {
    method: "SELECT_IN_SURROUND"
    params: {
        action: "move" | "select" | "extend",
        left: string | null,
        right: string | null,
        onDone?: OnDone
        count?: number,
        deleteSelection?: boolean
        ignoreCase?: boolean
        includeLastMatch?: boolean
    }
}

type ExecuteCommandRequest = RequestBase & {
    method: "EXECUTE_COMMAND"
    params: {
        command: string,
        args?: any[]
    }
}

type GoToLineRequest = RequestBase & {
    method: "GO_TO_LINE"
    params: {
        line: number,
    }
}

type ClientRequest =
    | PingRequest
    | SelectInSurroundRequest
    | ExecuteCommandRequest
    | GoToLineRequest
    | SmartActionRequest

type ClientResponseResult = JSONValue

type ClientResponseError = {
    code: number
    message: string
    data?: JSONValue
}

type ClientResponse = { jsonrpc: "2.0", id: string } & ({ result: ClientResponseResult } | { error: ClientResponseError })

type TreeNode = {
    childCount: number
    children: Array<TreeNode>
    endIndex: number
    endPosition: { row: number, column: number }
    isNamed: () => boolean
    parent: TreeNode | null
    startIndex: number
    startPosition: { row: number, column: number }
    type: string
    text: string
}


type NameToken = {
    type: "NAME"
    value: string
}

type NumberToken = {
    type: "NUMBER"
    value: number
}

type OpenCurlyBraceToken = {
    type: "OPEN_CURLY_BRACE"
}

type ClosedCurlyBraceToken = {
    type: "CLOSED_CURLY_BRACE"
}

type OpenBracketToken = {
    type: "OPEN_BRACKET"
}

type ClosedBracketToken = {
    type: "CLOSED_BRACKET"
}
type OpenParenToken = {
    type: "OPEN_PAREN"
}

type ClosedParenToken = {
    type: "CLOSED_PAREN"
}

type ColonToken = {
    type: "COLON"
}

type PeriodToken = {
    type: "PERIOD"
}

type RuleRefToken = {
    type: "RULE_REF"
    ruleName: string
}

type AsteriskToken = {
    type: "ASTERISK"
}

type QuestionMarkToken = {
    type: "QUESTION_MARK"
}

type AtSignToken = {
    type: "AT_SIGN"
}

type PipeToken = {
    type: "PIPE"
}

type NotToken = {
    type: "NOT"
}
type CommaToken = {
    type: "COMMA"
}

type Token =
    | NameToken
    | NumberToken
    | OpenCurlyBraceToken
    | ClosedCurlyBraceToken
    | OpenBracketToken
    | ClosedBracketToken
    | OpenParenToken
    | ClosedParenToken
    | ColonToken
    | PeriodToken
    | RuleRefToken
    | AsteriskToken
    | AtSignToken
    | QuestionMarkToken
    | PipeToken
    | NotToken
    | CommaToken

type Source = "anchor" | "active" | "start" | "end"

type NodeTarget = {
    selector: string,
    getEvery?: boolean
    side?: "start" | "end"
    count?: number
}

type TextTarget = {
    pattern: string
    side?: "start" | "end"
    count?: number
}

type Target = NodeTarget | TextTarget

type OnDone = "delete" | "cut" | "copy" | { type: "replace" }
type TargetAndDirection = { target: TextTarget, direction: "backwards" | "forwards" } |{ target: NodeTarget, direction: "backwards" | "forwards" | "smart" }

type SmartActionParams = {
    source: Source
    action: "move" | "select" | "extend"
    target: Target,
    direction: "backwards" | "forwards" | "smart",
    onDone?: onDone
} & TargetAndDirection

type SmartActionRequest = RequestBase & {
    method: "SMART_ACTION",
    params: SmartActionParams
}
// type BidirectionalExtendParams = {
//     backwards: Target
//     forwards: Target
//     onSelect?: OnSelect
// }

// type BidirectionalExtendRequest = RequestBase & {
//     method: "BIDIRECTIONAL_EXTEND",
//     params: BidirectionalExtendParams
// }

type NodeSearchContext = {
    type: "nodeSearchContext"
    root: TreeNode
    selector: Selector
    direction: "backwards" | "forwards" | "smart"
    count: number
    side: "start" | "end" | null
    getEvery: boolean
}

type TextSearchContext = {
    type: "textSearchContext"
    pattern: string
    ignoreCase: boolean
    direction: "backwards" | "forwards"
    count: number
    side: "start" | "end" | null
}

type SurroundSearchContext = {
    type: "surroundSearchContext"
    left: TextSearchContext
    right: TextSearchContext
    includeLastMatch: boolean
}

export type SearchContext = NodeSearchContext | TextSearchContext | SurroundSearchContext
