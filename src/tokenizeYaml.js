/**
 * @enum number
 */
export const State = {
  TopLevelContent: 1,
  InsideLineComment: 2,
  AfterPropertyName: 3,
  AfterPropertyNameAfterColon: 4,
  AfterDash: 5,
  AfterPropertyNameAfterColonAfterNewLine: 6,
  AfterPipe: 7,
  InsideMultiLineString: 8,
  InsideMultiLineStringAfterWhitespace: 9,
  AfterPropertyValue: 10,
  InsidePropertyNameStringSingleQuoted: 11,
  InsidePropertyNameStringDoubleQuoted: 12,
}

export const StateMap = {
  [State.TopLevelContent]: 'TopLevelContent',
  [State.InsideLineComment]: 'InsideLineComment',
}

/**
 * @enum number
 */
export const TokenType = {
  Comment: 885,
  CssSelector: 1,
  LanguageConstant: 11,
  NewLine: 884,
  None: 57,
  Numeric: 15,
  Punctuation: 13,
  Query: 886,
  Text: 887,
  Unknown: 881,
  Whitespace: 2,
  String: 188,
  YamlPropertyName: 123,
  YamlPropertyValueString: 124,
  Alias: 125,
  Anchor: 126,
}

export const TokenMap = {
  [TokenType.Comment]: 'Comment',
  [TokenType.CssSelector]: 'CssSelector',
  [TokenType.LanguageConstant]: 'LanguageConstant',
  [TokenType.NewLine]: 'NewLine',
  [TokenType.None]: 'None',
  [TokenType.Numeric]: 'Numeric',
  [TokenType.Query]: 'Query',
  [TokenType.Text]: 'Text',
  [TokenType.Unknown]: 'Unknown',
  [TokenType.Whitespace]: 'Whitespace',
  [TokenType.Punctuation]: 'Punctuation',
  [TokenType.String]: 'String',
  [TokenType.YamlPropertyName]: 'YamlPropertyName',
  [TokenType.YamlPropertyValueString]: 'YamlPropertyValueString',
  [TokenType.Alias]: 'VariableName',
  [TokenType.Anchor]: 'VariableName',
}

const RE_LINE_COMMENT_START = /^#/
const RE_WHITESPACE = /^ +/
const RE_CURLY_OPEN = /^\{/
const RE_CURLY_CLOSE = /^\}/
const RE_PROPERTY_NAME = /^[\:@\/\\a-zA-Z\-\_\d\.]+(?=\s*:(\s+|$))/
const RE_PROPERTY_NAME_2 =
  /^[\:@\/\\a-zA-Z\-\_\d\.\s]*[@\/\\a-zA-Z\-\_\d\.](?=\s*:(\s+|$))/
const RE_PROPERTY_VALUE_1 = /^[^&].*(?=\s+#)/s
const RE_SEMICOLON = /^;/
const RE_COMMA = /^,/
const RE_ANYTHING = /^.+/s
const RE_ANYTHING_BUT_COMMENT = /^[^#]+/
const RE_NUMERIC = /^(([0-9]+\.?[0-9]*)|(\.[0-9]+))(?=\s|$)/
const RE_ANYTHING_UNTIL_CLOSE_BRACE = /^[^\}]+/
const RE_BLOCK_COMMENT_START = /^\/\*/
const RE_BLOCK_COMMENT_END = /^\*\//
const RE_BLOCK_COMMENT_CONTENT = /^.+?(?=\*\/|$)/s
const RE_ROUND_OPEN = /^\(/
const RE_ROUND_CLOSE = /^\)/
const RE_PSEUDO_SELECTOR_CONTENT = /^[^\)]+/
const RE_SQUARE_OPEN = /^\[/
const RE_SQUARE_CLOSE = /^\]/
const RE_ATTRIBUTE_SELECTOR_CONTENT = /^[^\]]+/
const RE_QUERY = /^@[a-z\-]+/
const RE_STAR = /^\*/
const RE_QUERY_NAME = /^[a-z\-]+/
const RE_QUERY_CONTENT = /^[^\)]+/
const RE_COMBINATOR = /^[\+\>\~]/
const RE_LANGUAGE_CONSTANT = /^(?:true|false|null)(?!#)/
const RE_COLON = /^:/
const RE_DASH = /^\-/
const RE_WORDS = /^[\w\s]*\w/
const RE_MULTI_LINE_STRING_START = /^(?:\||>\-|>)/
const RE_KEY_PRE = /^\s*(\-\s*)?/
const RE_SINGLE_QUOTE = /^'/
const RE_DOUBLE_QUOTE = /^"/
const RE_STRING_SINGLE_QUOTE_CONTENT = /^[^']+/
const RE_ALIAS = /^\*.+/
const RE_ANCHOR = /^\&.+/
const RE_MERGE_KEY = /^<<\:(?=\s)/

export const initialLineState = {
  state: State.TopLevelContent,
  tokens: [],
  indent: '',
  keyOffset: 0,
}

export const hasArrayReturn = true

/**
 *
 * @param {string} line
 * @returns {number}
 */
const getKeyOffset = (line) => {
  const whiteSpaceMatch = line.match(RE_KEY_PRE)
  if (whiteSpaceMatch) {
    return whiteSpaceMatch[0].length
  }
  return 0
}

/**
 * @param {string} line
 * @param {any} lineState
 */
export const tokenizeLine = (line, lineState) => {
  let next = null
  let index = 0
  let tokens = []
  let token = TokenType.None
  let state = lineState.state
  let keyOffset = lineState.keyOffset
  while (index < line.length) {
    const part = line.slice(index)
    switch (state) {
      case State.TopLevelContent:
        if ((next = part.match(RE_LINE_COMMENT_START))) {
          token = TokenType.Comment
          state = State.InsideLineComment
        } else if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.TopLevelContent
        } else if ((next = part.match(RE_LANGUAGE_CONSTANT))) {
          token = TokenType.LanguageConstant
          state = State.TopLevelContent
        } else if ((next = part.match(RE_DASH))) {
          token = TokenType.Punctuation
          state = State.AfterDash
        } else if ((next = part.match(RE_PROPERTY_NAME))) {
          token = TokenType.YamlPropertyName
          state = State.AfterPropertyName
        } else if ((next = part.match(RE_PROPERTY_NAME_2))) {
          token = TokenType.YamlPropertyName
          state = State.AfterPropertyName
        } else if ((next = part.match(RE_NUMERIC))) {
          token = TokenType.Numeric
          state = State.TopLevelContent
        } else if ((next = part.match(RE_WORDS))) {
          token = TokenType.Text
          state = State.TopLevelContent
        } else if ((next = part.match(RE_SINGLE_QUOTE))) {
          token = TokenType.Punctuation
          state = State.InsidePropertyNameStringSingleQuoted
        } else if ((next = part.match(RE_MERGE_KEY))) {
          token = TokenType.Punctuation
          state = State.AfterPropertyNameAfterColon
        } else if ((next = part.match(RE_ANYTHING))) {
          token = TokenType.Text
          state = State.TopLevelContent
        } else {
          part //?
          throw new Error('no')
        }
        break
      case State.InsideLineComment:
        if ((next = part.match(RE_ANYTHING))) {
          token = TokenType.Comment
          state = State.TopLevelContent
        } else {
          throw new Error('no')
        }
        break
      case State.AfterPropertyName:
        if ((next = part.match(RE_COLON))) {
          token = TokenType.Punctuation
          state = State.AfterPropertyNameAfterColon
        } else if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterPropertyName
        } else {
          throw new Error('no')
        }
        break
      case State.AfterPropertyNameAfterColon:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterPropertyNameAfterColon
        } else if ((next = part.match(RE_LANGUAGE_CONSTANT))) {
          token = TokenType.LanguageConstant
          state = State.TopLevelContent
        } else if ((next = part.match(RE_NUMERIC))) {
          token = TokenType.Numeric
          state = State.TopLevelContent
        } else if ((next = part.match(RE_LINE_COMMENT_START))) {
          token = TokenType.Comment
          state = State.InsideLineComment
        } else if ((next = part.match(RE_MULTI_LINE_STRING_START))) {
          token = TokenType.Punctuation
          state = State.AfterPipe
        } else if ((next = part.match(RE_PROPERTY_VALUE_1))) {
          token = TokenType.YamlPropertyValueString
          state = State.AfterPropertyValue
        } else if ((next = part.match(RE_ANCHOR))) {
          token = TokenType.Anchor
          state = State.AfterPropertyNameAfterColon
        } else if ((next = part.match(RE_ANYTHING))) {
          token = TokenType.YamlPropertyValueString
          state = State.TopLevelContent
        } else {
          throw new Error('no')
        }
        break
      case State.AfterPropertyValue:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterPropertyValue
        } else if ((next = part.match(RE_LINE_COMMENT_START))) {
          token = TokenType.Comment
          state = State.InsideLineComment
        } else {
          part
          throw new Error('no')
        }
        break
      case State.AfterPipe:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterPipe
        } else {
          throw new Error('no')
        }
        break
      case State.AfterDash:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterDash
        } else if ((next = part.match(RE_PROPERTY_NAME))) {
          token = TokenType.YamlPropertyName
          state = State.AfterPropertyName
        } else if ((next = part.match(RE_LANGUAGE_CONSTANT))) {
          token = TokenType.LanguageConstant
          state = State.TopLevelContent
        } else if ((next = part.match(RE_NUMERIC))) {
          token = TokenType.Numeric
          state = State.TopLevelContent
        } else if ((next = part.match(RE_MULTI_LINE_STRING_START))) {
          token = TokenType.Punctuation
          state = State.AfterPipe
        } else if ((next = part.match(RE_ALIAS))) {
          token = TokenType.Alias
          state = State.TopLevelContent
        } else if ((next = part.match(RE_ANYTHING))) {
          token = TokenType.YamlPropertyValueString
          state = State.TopLevelContent
        } else {
          throw new Error('no')
        }
        break
      case State.AfterPropertyNameAfterColonAfterNewLine:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterPropertyNameAfterColonAfterNewLine
        } else if ((next = part.match(RE_DASH))) {
          token = TokenType.Punctuation
          state = State.AfterDash
        } else if ((next = part.match(RE_PROPERTY_NAME))) {
          token = TokenType.YamlPropertyName
          state = State.AfterPropertyName
        } else if ((next = part.match(RE_NUMERIC))) {
          token = TokenType.Numeric
          state = State.TopLevelContent
        } else if ((next = part.match(RE_LANGUAGE_CONSTANT))) {
          token = TokenType.LanguageConstant
          state = State.TopLevelContent
        } else if ((next = part.match(RE_WORDS))) {
          token = TokenType.YamlPropertyValueString
          state = State.TopLevelContent
        } else if ((next = part.match(RE_LINE_COMMENT_START))) {
          token = TokenType.Comment
          state = State.InsideLineComment
        } else if ((next = part.match(RE_SINGLE_QUOTE))) {
          token = TokenType.Punctuation
          state = State.InsidePropertyNameStringSingleQuoted
        } else if ((next = part.match(RE_DOUBLE_QUOTE))) {
          token = TokenType.Punctuation
          state = State.InsidePropertyNameStringDoubleQuoted
        } else {
          part
          throw new Error('no')
        }
        break
      case State.InsidePropertyNameStringSingleQuoted:
        if ((next = part.match(RE_SINGLE_QUOTE))) {
          token = TokenType.Punctuation
          state = State.AfterPropertyName
        } else if ((next = part.match(RE_STRING_SINGLE_QUOTE_CONTENT))) {
          token = TokenType.String
          state = State.InsidePropertyNameStringSingleQuoted
        } else {
          throw new Error('no')
        }
        break
      case State.InsidePropertyNameStringDoubleQuoted:
        if ((next = part.match(RE_SINGLE_QUOTE))) {
          token = TokenType.Punctuation
          state = State.AfterPropertyName
        } else if ((next = part.match(RE_STRING_SINGLE_QUOTE_CONTENT))) {
          token = TokenType.String
          state = State.InsidePropertyNameStringSingleQuoted
        } else {
          throw new Error('no')
        }
        break
      case State.InsideMultiLineString:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          if (next[0].length > keyOffset) {
            state = State.InsideMultiLineStringAfterWhitespace
          } else {
            state = State.TopLevelContent
          }
        } else if ((next = part.match(RE_PROPERTY_NAME))) {
          token = TokenType.YamlPropertyName
          state = State.AfterPropertyName
        } else if ((next = part.match(RE_DASH))) {
          token = TokenType.Punctuation
          state = State.AfterDash
        } else if ((next = part.match(RE_LINE_COMMENT_START))) {
          token = TokenType.Comment
          state = State.InsideLineComment
        } else if ((next = part.match(RE_ANYTHING))) {
          token = TokenType.Text
          state = State.TopLevelContent
        } else {
          throw new Error('no')
        }
        break
      case State.InsideMultiLineStringAfterWhitespace:
        if ((next = part.match(RE_ANYTHING))) {
          token = TokenType.YamlPropertyValueString
          state = State.InsideMultiLineString
        } else {
          throw new Error('no')
        }
        break
      default:
        console.log({ state, line })
        throw new Error('no')
    }
    const tokenLength = next[0].length
    index += tokenLength
    tokens.push(token, tokenLength)
  }
  switch (state) {
    case State.AfterPropertyNameAfterColon:
      state = State.AfterPropertyNameAfterColonAfterNewLine
      break
    case State.AfterPipe:
      keyOffset = getKeyOffset(line)
      keyOffset
      line
      state = State.InsideMultiLineString
      break
    default:
      break
  }
  return {
    state,
    tokens,
    keyOffset,
  }
}
