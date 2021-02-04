const sveltePreprocess = require("svelte-preprocess");

const preprocess = sveltePreprocess({
  postcss: {
    plugins: [require("tailwindcss"), require("autoprefixer")],
  },
  preprocess: sveltePreprocess({
    defaults: {
      script: "typescript",
    },
  }),
});

module.exports = {
  preprocess,
};
