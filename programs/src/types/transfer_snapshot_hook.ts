export type TransferSnapshotHook = {
  "version": "0.1.0",
  "name": "transfer_snapshot_hook",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "snapshotConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "maxSnapshots",
          "type": "u8"
        }
      ]
    },
    {
      "name": "defineSnapshot",
      "accounts": [
        {
          "name": "snapshotConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "timestampOffset",
          "type": "i64"
        }
      ]
    },
    {
      "name": "activate",
      "accounts": [
        {
          "name": "snapshotConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "initSnapshotBalancesAccount",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "snapshotConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "snapshotBalances",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "transferHook",
      "accounts": [
        {
          "name": "source",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "destination",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "extraAccountMetaList",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "snapshotConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sourceSnapshotBalances",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destinationSnapshotBalances",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeExtraAccountMetaList",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "extraAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "snapshotConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "snapshotConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "definedSnapshots",
            "type": "u8"
          },
          {
            "name": "snapshots",
            "type": {
              "vec": "i64"
            }
          },
          {
            "name": "activatedDate",
            "type": {
              "option": "i64"
            }
          }
        ]
      }
    },
    {
      "name": "snapshotTokenAccountBalances",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "snapshotBalances",
            "type": {
              "vec": {
                "option": "u64"
              }
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Unauthorized"
    },
    {
      "code": 6001,
      "name": "NoSnapshotFound",
      "msg": "No snapshot found"
    },
    {
      "code": 6002,
      "name": "Active",
      "msg": "Snapshots are active"
    },
    {
      "code": 6003,
      "name": "Inactive",
      "msg": "Snapshots are inactive"
    },
    {
      "code": 6004,
      "name": "InvalidTimestamp",
      "msg": "Invalid timestamp"
    }
  ]
};

export const IDL: TransferSnapshotHook = {
  "version": "0.1.0",
  "name": "transfer_snapshot_hook",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "snapshotConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "maxSnapshots",
          "type": "u8"
        }
      ]
    },
    {
      "name": "defineSnapshot",
      "accounts": [
        {
          "name": "snapshotConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "timestampOffset",
          "type": "i64"
        }
      ]
    },
    {
      "name": "activate",
      "accounts": [
        {
          "name": "snapshotConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "initSnapshotBalancesAccount",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "snapshotConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "snapshotBalances",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "transferHook",
      "accounts": [
        {
          "name": "source",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "destination",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "extraAccountMetaList",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "snapshotConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sourceSnapshotBalances",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destinationSnapshotBalances",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeExtraAccountMetaList",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "extraAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "snapshotConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "snapshotConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "definedSnapshots",
            "type": "u8"
          },
          {
            "name": "snapshots",
            "type": {
              "vec": "i64"
            }
          },
          {
            "name": "activatedDate",
            "type": {
              "option": "i64"
            }
          }
        ]
      }
    },
    {
      "name": "snapshotTokenAccountBalances",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "snapshotBalances",
            "type": {
              "vec": {
                "option": "u64"
              }
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Unauthorized"
    },
    {
      "code": 6001,
      "name": "NoSnapshotFound",
      "msg": "No snapshot found"
    },
    {
      "code": 6002,
      "name": "Active",
      "msg": "Snapshots are active"
    },
    {
      "code": 6003,
      "name": "Inactive",
      "msg": "Snapshots are inactive"
    },
    {
      "code": 6004,
      "name": "InvalidTimestamp",
      "msg": "Invalid timestamp"
    }
  ]
};
