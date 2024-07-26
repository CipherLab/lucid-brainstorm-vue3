// src/boot/lucidFlow.ts
import { boot } from 'quasar/wrappers';
import useLucidFlow from 'src/composables/useLucidFlow';

export default boot(({ app }) => {
  const lucidFlow = useLucidFlow();
  app.provide('lucidFlow', lucidFlow);
});
