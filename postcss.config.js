const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

module.exports = {
  plugins: [
    autoprefixer({
      browsers: ['last 10 Chrome versions', 'last 10 Firefox versions', 'Safari >= 7', 'ie > 10']
    }),
    cssnano({ assets: 'default' })
  ]
};