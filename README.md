# Prototype Virtual Machine

The [vm.ts](/vm.ts) uses less 200 LoC demonstrates the core mechanism in a virtual machine.

Assume we have a program written in a tiny script:

```js
fn1(a, b) => a + b
fn2(a, b) => a - b
main() =>
 fn2(fn1(1, 3), 1)
```

the equivalent bytecode for above code to be interpreted by out prototype virtual machine can be constructed manually:

```js
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
```

Run above example by `deno run vm.ts`，the output will be:

```js
{ TOP: 3 }
```

shows you that the topmost value on the operand stack is `3`
