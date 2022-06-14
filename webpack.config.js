const nodeExternals = require('webpack-node-externals');
const path = require('path');

const typicalReact = {
  rules: [
    {
      test: /\.js$/,
      exclude: /(node_modules)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-react']
        }
      }
    },
    {
      test: /\.(png|jpe?g|webp|tiff?)/i,
      use: [
        {
          loader: 'webpack-sharp-loader',
          options: {
            toBuffer: false,
            processFunction: sharp => sharp.negate().webp(),
            // optional options passed to internal file-loader
            fileLoaderOptions: {
              name: '[name]-[contenthash].[ext]'
            }
          }
        }
      ]
    }
  ]
};

const clientConfig = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'main.js'
  },
  mode: 'development',
  module: typicalReact
};

const serverConfig = {
  entry: './server.js',
  output: {
    path: __dirname,
    filename: 'server-compiled.js'
  },
  externals: [nodeExternals()],
  target: 'node',
  mode: 'production',
  module: typicalReact
};

module.exports = [clientConfig, serverConfig];
