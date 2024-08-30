// src/directives/copy-code.ts
import { Directive, DirectiveBinding } from 'vue';
import { useQuasar } from 'quasar';
import { emitter } from '../eventBus';
const $q = useQuasar();

const copyCodeDirective: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    // Find all <code> elements within the target element

    const codeElements = el.querySelectorAll('pre');
    console.log('codeElements', codeElements);
    codeElements.forEach((codeEl) => {
      const icon = document.createElement('i');
      icon.classList.add(
        'copy-code-button',
        'q-icon',
        'notranslate',
        'material-icons'
      );
      icon.setAttribute('cursor', 'pointer');
      icon.setAttribute('position', 'relative');
      icon.setAttribute('float', 'right');
      icon.setAttribute('role', 'presentation');
      icon.textContent = 'content_copy';

      icon.addEventListener('click', () => {
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
      wrapper.appendChild(icon); // Add the icon to the wrapper

      // Replace the original code element with the wrapper
      codeEl.parentNode?.replaceChild(wrapper, codeEl);
    });
  },
};

export default copyCodeDirective;
