module.exports = {
    env: {
        browser: true,
        es2021: true
    },
    extends: [
        'airbnb',
        'airbnb/hooks'
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    rules: {
        indent: ['error', 4],
        'react/jsx-indent': ['error', 4],
        'react/jsx-indent-props': ['error', 4],
        'no-console': ['error'],
        'max-lines': ['error', 400],
        'max-lines-per-function': ['error', 75]
    }
};
