# Local Development

## Hot reload

Open a terminal and run the following command in one tab:

```
docker compose up
```

This is the window where you will see the logs of the application.
In order to enable hot reload open another terminal tab and run the following command:

```
docker compose watch --no-up
```

This is where you will see the logs of the watcher - what files are changed and what do they trigger.
