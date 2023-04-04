import { assert } from "std/testing/asserts.ts";

enum OPCode {
  LOAD_0,
  LOAD_1,
  LOAD_2,
  LOAD_3,

  ADD,
  SUB,

  CALL,
  RET,
  POP,
  PUSHA_1,
  PUSHA_2,

  PRINT,
}

class Fn {
  constructor(public code: OPCode[] = []) {}
}

class CallFrame {
  bp = 0;
  sp = 0;
  pc = 0;
  fn = 0;
}

class VM {
  sp = 0;
  stack: Uint32Array;

  pc = 0;
  fn = 0;

  callStack: CallFrame[] = [];

  fns: Fn[];
  code: OPCode[] = [];

  constructor(stackSize: number, fns: Fn[] = []) {
    this.stack = new Uint32Array(stackSize);
    this.sp = stackSize;
    this.fns = fns;
  }

  push(v: number) {
    assert(this.sp > 0, "stack overflow");
    this.stack[--this.sp] = v;
  }

  pop() {
    assert(this.sp < this.stack.length, "stack underflow");
    return this.stack[this.sp++];
  }

  top() {
    return this.stack[this.sp];
  }

  run(main: number) {
    const nf = new CallFrame();
    nf.fn = main;
    this.code = this.fns[nf.fn].code;
    this.callStack.push(nf);

    this.ic();
  }

  get cf() {
    return this.callStack[this.callStack.length - 1];
  }

  ic() {
    while (this.pc < this.code.length) {
      const op = this.code[this.pc];
      switch (op) {
        case OPCode.LOAD_1:
        case OPCode.LOAD_2:
        case OPCode.LOAD_3: {
          const i = op - OPCode.LOAD_0;
          this.push(i);
          this.pc++;
          break;
        }
        case OPCode.ADD: {
          const rhs = this.pop();
          const lhs = this.pop();
          this.push(lhs + rhs);
          this.pc++;
          break;
        }
        case OPCode.SUB: {
          const rhs = this.pop();
          const lhs = this.pop();
          this.push(lhs - rhs);
          this.pc++;
          break;
        }
        case OPCode.CALL: {
          const nf = new CallFrame();
          nf.fn = this.code[this.pc + 1];
          nf.bp = this.sp;
          this.pc += 2;

          const cf = this.cf;
          cf.sp = this.sp;
          cf.pc = this.pc;

          this.code = this.fns[nf.fn].code;
          this.pc = 0;
          this.callStack.push(nf);

          break;
        }
        case OPCode.PUSHA_1:
        case OPCode.PUSHA_2: {
          const i = op - OPCode.PUSHA_1 + 1;
          this.push(this.stack[this.cf.bp + i]);
          this.pc++;
          break;
        }
        case OPCode.RET: {
          this.callStack.pop();
          const cf = this.cf; // caller's frame
          if (!cf) return;

          const retval = this.stack[this.sp];
          const argN = this.stack[cf.sp];

          this.sp = cf.sp + argN;
          this.stack[this.sp] = retval;

          this.pc = cf.pc;
          this.code = this.fns[cf.fn].code;
          break;
        }
        case OPCode.POP: {
          const n = this.code[++this.pc];
          for (let i = 0; i < n; i++) this.pop();
          break;
        }
        case OPCode.PRINT: {
          console.log({ TOP: this.pop() });
          this.pc++;
          break;
        }
        default:
          throw new Error("unsupported opcode: " + op);
      }
    }
  }
}

// fn1(a, b) => a + b
// fn2(a, b) => a - b
// main() =>
//  fn2(fn1(1, 3), 1)
const vm = new VM(20, [
  new Fn([
    OPCode.LOAD_1,

    OPCode.LOAD_3, OPCode.LOAD_1, OPCode.LOAD_2,
    OPCode.CALL, 1,

    OPCode.LOAD_2,
    OPCode.CALL, 2,

    OPCode.PRINT,

    OPCode.RET,
  ]),
  new Fn([
    OPCode.PUSHA_1,
    OPCode.PUSHA_2,
    OPCode.ADD,
    OPCode.RET,
  ]),
  new Fn([
    OPCode.PUSHA_1,
    OPCode.PUSHA_2,
    OPCode.SUB,
    OPCode.RET,
  ]),
]);

vm.run(0);
