export type DummyOracle = {
  "version": "0.1.0",
  "name": "dummy_oracle",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "quoteCurrencyMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "dummyOracle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "assetSymbol",
          "type": "string"
        },
        {
          "name": "initialPrice",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updatePrice",
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "dummyOracle",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "assetSymbol",
          "type": "string"
        },
        {
          "name": "newPrice",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "dummyOracleAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "assetSymbol",
            "type": "string"
          },
          {
            "name": "currentPrice",
            "type": "u64"
          },
          {
            "name": "quoteCurrencyMint",
            "type": "publicKey"
          },
          {
            "name": "lastUpdate",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};

export const IDL: DummyOracle = {
  "version": "0.1.0",
  "name": "dummy_oracle",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "quoteCurrencyMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "dummyOracle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "assetSymbol",
          "type": "string"
        },
        {
          "name": "initialPrice",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updatePrice",
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "dummyOracle",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "assetSymbol",
          "type": "string"
        },
        {
          "name": "newPrice",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "dummyOracleAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "assetSymbol",
            "type": "string"
          },
          {
            "name": "currentPrice",
            "type": "u64"
          },
          {
            "name": "quoteCurrencyMint",
            "type": "publicKey"
          },
          {
            "name": "lastUpdate",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
