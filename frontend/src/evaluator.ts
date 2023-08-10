import {
  BooleanLiteral,
  ExpressionStatement,
  IntegerLiteral,
  type Node,
  Program,
  StringLiteral,
  PrefixExpression,
  InfixExpression,
  BlockStatement,
  IfExpression,
  ReturnStatement,
LetStatement,
Identifier,
} from "./ast.ts";
import {
  FALSE,
  Integer_OBJ,
  NULL,
  String_OBJ,
  TRUE,
  returnValue,
  type mk_Object,
  error_OBJ,
Environment,
} from "./object.ts";
import { ObjectType } from "./types.ts";

export function evaluate(node: Node, env: Environment): mk_Object {
  if (node instanceof ExpressionStatement) {
    if (node.expr == undefined) {
      return new error_OBJ("expression of ExpressionStatement is undefined");
    }
    return evaluate(node.expr, env);
  } /* literal expressions */ else if (node instanceof IntegerLiteral) {
    return new Integer_OBJ(node.val);
  } else if (node instanceof BooleanLiteral) {
    return node.val ? TRUE : FALSE;
  } else if (node instanceof StringLiteral) {
    return new String_OBJ(node.val);
  } else if (node instanceof Program) {
    return evalProgram(node, env);
  } else if (node instanceof PrefixExpression) {
    if (node.right == undefined) {
      return new error_OBJ("right expression of PrefixExpression is undefined");
    }
    const right = evaluate(node.right, env);
    return evalPrefixExpression(node.operator, right);
  } else if (node instanceof InfixExpression) {
    const left = evaluate(node.left, env);
    if (node.right == undefined) {
      return new error_OBJ("right expression of InfixExpression is undefined");
    }
    const right = evaluate(node.right, env);
    return evalInfixExpression(node.oper, left, right);
  } else if (node instanceof BlockStatement) {
    return evalBlockStatement(node, env);
  } else if (node instanceof IfExpression) {
    return evalIfExpression(node, env);
  } else if (node instanceof ReturnStatement) {
    if (node.rval == undefined) {
      return NULL;
    }
    const val = evaluate(node.rval, env);
    if (val == undefined) {
      return NULL;
    }
    return new returnValue(val);
  } else if (node instanceof LetStatement) {
    if(node.val == undefined){
      return new error_OBJ(`let statement with undefined value`)
    }
    const val = evaluate(node.val, env)
    if(isError(val)){
      return val
    }
    env.set(node.name.val, val)
  } else if (node instanceof Identifier) {
    return evalIdentifier(node, env)
  }
  return new error_OBJ(`unhandled ast node of type${node.constructor.name}`);
}

function evalProgram(prog: Program, env: Environment): mk_Object {
  let result: mk_Object = NULL;
  for (const statement of prog.statements) {
    result = evaluate(statement, env);

    if (result instanceof returnValue) {
      return result.value;
    } else if (result instanceof error_OBJ) {
      return result;
    }
  }
  return result;
}

function evalBlockStatement(block: BlockStatement, env: Environment): mk_Object {
  let result: mk_Object = NULL;

  for (const stmt of block.statements) {
    const tmp = evaluate(stmt, env);
    result = tmp == undefined ? NULL : tmp;
    if (result instanceof returnValue || result instanceof error_OBJ) {
      return result;
    }
  }

  return result;
}

function evalPrefixExpression(oper: string, right: mk_Object): mk_Object {
  switch (oper) {
    case "!":
      return evalBangOperatorExpression(right);
    case "-":
      return evalMinusPrefixOperatorExpression(right);
    default:
      return new error_OBJ(`unknown operator: ${oper}${right.Type()}`);
  }
}

function evalBangOperatorExpression(right: mk_Object): mk_Object {
  switch (right) {
    case TRUE:
      return FALSE;
    case FALSE:
      return TRUE;
    case NULL:
      return TRUE;
    default:
      return FALSE;
  }
}

function evalMinusPrefixOperatorExpression(right: mk_Object): mk_Object {
  if (right.Type() != ObjectType.INTEGER) {
    return new error_OBJ(`unknown operator: -${right.Type()}`);
  }
  const value = (right as Integer_OBJ).val;
  return new Integer_OBJ(-value);
}

function evalInfixExpression(
  operator: string,
  left: mk_Object,
  right: mk_Object
): mk_Object {
  if (left.Type() != right.Type()) {
    return new error_OBJ(
      `type mismatch: ${left.Type()} ${operator} ${right.Type()}`
    );
  }
  if (left.Type() == ObjectType.INTEGER && right.Type() == ObjectType.INTEGER) {
    return evalIntegerInfixExpression(operator, left, right);
  }
  // should only be entered by booleans or null
  // we can check for hard equality because we never allocate new booleans
  // so the objects will be the same ones in memory
  if (operator === "==") {
    return left === right ? TRUE : FALSE;
  } else if (operator === "!=") {
    return left !== right ? TRUE : FALSE;
  }
  return new error_OBJ(
    `unknown operator: ${left.Type()} ${operator} ${right.Type()}`
  );
}

function evalIntegerInfixExpression(
  operator: string,
  left: mk_Object,
  right: mk_Object
): mk_Object {
  const rightVal = (right as Integer_OBJ).val;
  const leftVal = (left as Integer_OBJ).val;
  switch (operator) {
    case "+":
      return new Integer_OBJ(leftVal + rightVal);
    case "-":
      return new Integer_OBJ(leftVal - rightVal);
    case "*":
      return new Integer_OBJ(leftVal * rightVal);
    case "/":
      return new Integer_OBJ(Math.floor(leftVal / rightVal));
    case "<":
      return leftVal < rightVal ? TRUE : FALSE;
    case ">":
      return leftVal > rightVal ? TRUE : FALSE;
    case "==":
      return leftVal == rightVal ? TRUE : FALSE;
    case "!=":
      return leftVal != rightVal ? TRUE : FALSE;
    default:
      return new error_OBJ(
        `unknown operator: ${left.Type()} ${operator} ${right.Type()}`
      );
  }
}

function evalIfExpression(node: IfExpression, env: Environment): mk_Object {
  const cond = evaluate(node.condition, env);
  if (cond == undefined) {
    return new error_OBJ("Expecting result, got undefined instead.");
  }
  if (isTruthy(cond)) {
    return evaluate(node.consequence, env);
  } else if (node.alternative != undefined) {
    return evaluate(node.alternative, env);
  }
  return NULL;
}

function evalIdentifier(node: Identifier, env: Environment): mk_Object {
  const val = env.get(node.val)
  if(val == undefined){
    return new error_OBJ(`identifier not found: ${node.val}`)
  }
  return val
}

function isTruthy(obj: mk_Object): boolean {
  if (obj == NULL) {
    return false;
  } else if (obj == TRUE) {
    return true;
  } else if (obj == FALSE) {
    return false;
  }
  return true;
}

function isError(obj: mk_Object | undefined) {
  if (obj == undefined) {
    return false;
  }
  return obj.Type() == ObjectType.ERROR;
}
