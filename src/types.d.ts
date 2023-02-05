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

type ExecuteCommandsPerSelectionRequest = RequestBase & {
    method: "EXECUTE_COMMANDS_PER_SELECTION"
    params: {
        commands: string[],
        onDone?: OnDone
        count: number
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
    | SurroundInsertRequest
    | ExecuteCommandsPerSelectionRequest

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
    id: number
    isNamed: () => boolean
    nextNamedSibling: TreeNode | null
    nextSibling: TreeNode | null
    parent: TreeNode | null
    previousNamedSibling: TreeNode | null
    previousSibling: TreeNode | null
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
    | OpenBracketToken
    | ClosedBracketToken
    | OpenParenToken
    | ClosedParenToken
    | ColonToken
    | PeriodToken
    | AsteriskToken
    | AtSignToken
    | QuestionMarkToken
    | PipeToken
    | NotToken
    | CommaToken

type TokenType = Token['type']

type ExtractOnProp<T, K extends keyof T, V> =
    T extends unknown ? V extends T[K] ?
    { [P in keyof T]: P extends K ? T[P] & V : T[P] }
    : never : never

type TokenOptions<V extends TokenType> = ExtractOnProp<Token, "type", V>

// type Foo<T extends Token['type']> = Foo.type is true


type Source = "anchor" | "active" | "start" | "end"

type NodeTarget = {
    type: "nodeTarget"
    selector: string,
    side?: "start" | "end"
    count?: number
    greedy?: boolean
    direction: "backwards" | "forwards" | "smart",
}

type TextTarget = {
    type: "textTarget"
    pattern: string
    side?: "start" | "end"
    count?: number
    direction: "backwards" | "forwards",
}

type CurrentSelectionTarget = {
    type: "currentSelectionTarget"
}

type Target = NodeTarget | TextTarget | CurrentSelectionTarget

type OnDone =
    | { type: "delete" }
    | { type: "cut" } 
    | { type: "copy" } 
    | { type: "executeCommand", commandName: string } 
    | { type: "surroundReplace", left: string, right: string } 
    | { type: "surroundInsert", left: string, right: string }
type TargetAndDirection = { target: TextTarget, direction: "backwards" | "forwards" } | { target: NodeTarget, direction: "backwards" | "forwards" | "smart" }

type SmartActionParams = {
    source: Source
    action: "move" | "select" | "extend"
    target: NodeTarget | TextTarget,
    getEvery?: boolean
    onDone?: onDone
}

type SmartActionRequest = RequestBase & {
    method: "SMART_ACTION",
    params: SmartActionParams
}

type SurroundInsertRequest = RequestBase & {
    method: "SURROUND_INSERT"
    params: { left: string, right: string }
}

type NodeSearchContext = {
    type: "nodeSearchContext"
    root: TreeNode
    selector: Selector
    direction: "backwards" | "forwards" | "smart"
    count: number
    side: "start" | "end" | null
    getEvery: boolean
    resultInfo: { [key in string]: any }
    greedy: boolean
}

type TextSearchContext = {
    type: "textSearchContext"
    pattern: string
    ignoreCase: boolean
    direction: "backwards" | "forwards"
    count: number
    side: "start" | "end" | null
    resultInfo: { [key in string]: any }
}

type SurroundSearchContext = {
    type: "surroundSearchContext"
    left: TextSearchContext
    right: TextSearchContext
    includeLastMatch: boolean
    resultInfo: { [key in string]: any }
}

type CurrentSelectionSearchContext = {
    type: "currentSelectionSearchContext"
    resultInfo: { [key in string]: any }
}

export type SearchContext = NodeSearchContext | TextSearchContext | SurroundSearchContext | CurrentSelectionSearchContext
