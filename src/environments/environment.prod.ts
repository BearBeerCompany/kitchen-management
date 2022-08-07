export const environment = {
  production: true,
  connector: "fs",
  webSocket: {
    endpoint: 'http://localhost:8080/ws',
    defaultTopic: '/topic/greetings',
    pkmiTopic: '/topic/pkmi'
  }
};
