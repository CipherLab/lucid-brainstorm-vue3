import { boot } from 'quasar/wrappers';
import QMarkdown from '@quasar/quasar-ui-qmarkdown';
import mark from 'markdown-it-mark'; // If using this plugin

export default boot(({ app }) => {
  app.use(QMarkdown, {
    // Register QMarkdown as the plugin
    globalProps: {
      // Use the 'globalProps' property
      noHtml: false,
      plugins: [mark], // If using additional plugins
    },
  });
});
