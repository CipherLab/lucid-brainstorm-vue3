// src/directives/copy-code.ts
import { Directive, DirectiveBinding } from 'vue';
import { event, useQuasar } from 'quasar';
import { emitter, GenericEvent } from '../eventBus';
const $q = useQuasar();

const copyCodeDirective: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    // Find all <code class="language-..."> elements within the target element
    //const codeElements = el.querySelectorAll('code');
    const codeElements = el.querySelectorAll('code[class*="language-"]');

    codeElements.forEach((codeEl) => {
      const button = document.createElement('button');
      button.textContent = 'Copy';
      button.classList.add('copy-code-button');
      button.setAttribute('icon', 'content_copy');
      button.setAttribute('dense', 'true'); // Make it dense
      button.setAttribute('flat', 'true'); // Make it flat
      button.setAttribute('size', 'sm'); // Make it small

      button.addEventListener('click', () => {
        const code = codeEl.textContent?.trim() || '';
        navigator.clipboard
          .writeText(code)
          .then(() => {
            emitter.emit('node:code-copied', { data: {} });
          })
          .catch((err) => {
            emitter.emit('node:error', { data: err });
          });
      });

      // Create a wrapper div for positioning
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';

      // Clone the code element
      const clonedCodeEl = codeEl.cloneNode(true) as HTMLElement;
      wrapper.appendChild(clonedCodeEl); // Add the CLONED code element to the wrapper
      wrapper.appendChild(button); // Add the button to the wrapper

      // Replace the original code element with the wrapper
      codeEl.parentNode?.replaceChild(wrapper, codeEl);
    });
  },
};

export default copyCodeDirective;
