export const environment = {
  production: true,
  connector: "api",
  webSocket: {
    endpoint: 'http://localhost:8080/ws',
    defaultTopic: '/topic/greetings',
    pkmiTopic: '/topic/pkmi'
  },
  api: {
    protocol: 'http',
    hostname: 'localhost',
    port: '8081',
    context: null
  }
};
