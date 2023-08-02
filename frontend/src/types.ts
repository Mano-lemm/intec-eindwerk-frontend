import { type Expression } from "./ast";

export type prefixParseFn = () => Expression;
export type infixParseFun = (expr: Expression) => Expression;

export enum TokenType {
  //special
  Illegal = "Illegal",
  EOF = "EOF",

  // ident and literal
  Ident = "Ident",
  Int = "Int",
  String = "String",

  // operations
  Assign = "Assign",
  Plus = "Plus",
  Minus = "Minus",
  Bang = "Bang",
  Asterisk = "Asterisk",
  Slash = "Slash",
  LessThan = "LessThan",
  GreaterThan = "GreaterThan",
  Equal = "Equal",
  NotEqual = "NotEqual",

  // semantic
  Comma = "Comma",
  Semicolon = "Semicolon",
  Colon = "Colon",

  // keywords
  Function = "Function",
  Let = "Let",
  True = "True",
  False = "False",
  If = "If",
  Else = "Else",
  Return = "Return",

  // braces
  LeftRoundBrace = "LeftRoundBrace",
  RightRoundBrace = "RightRoundBrace",
  LeftSquirlyBrace = "LeftSquirlyBrace",
  RightSquirlyBrace = "RightSquirlyBrace",
  LeftSquareBrace = "LeftSquareBrace",
  RightSquareBrace = "RightSquareBrace",
}

export type token = { token: TokenType; literal: string | number };

export const keywords: Record<string, TokenType> = {
  fn: TokenType.Function,
  let: TokenType.Let,
  true: TokenType.True,
  false: TokenType.False,
  if: TokenType.If,
  else: TokenType.Else,
  return: TokenType.Return,
} as const;

export enum operationOrder {
  LOWEST = 0,
  EQUALS = 1,
  LESSGREATER = 2,
  SUM = 3,
  PRODUCT = 4,
  PREFIX = 5,
  CALL = 6,
}
