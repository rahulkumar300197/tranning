module.exports = {
    "extends": "airbnb-base",
    "rules": {
        "comma-dangle": ["error", "always-multiline"],
        "func-names": ["error", "never"],
        "no-underscore-dangle": ["error",{ "allow": ["_id","__v","_httpMessage"] }],
        "max-len": ["error", { "code": 150, "tabWidth":4, "ignoreUrls":true, "ignoreTemplateLiterals": true, "ignoreRegExpLiterals":true}],
        "newline-per-chained-call": ["error", { "ignoreChainWithDepth": 5 }],
        "no-multi-assign": 0,
        "import/no-dynamic-require":0,
        "no-param-reassign":0,
        "consistent-return": 0,
        "no-undef":0
    },
    "plugins": [
        "import"
    ]
};