require("module-alias/register");

import Application from "../index";

const app = new Application();

app.setBeforeStartCallback(() => {
  console.log("Before start");
});

app.setAfterStartCallback(() => {
  console.log("After start");
});

app.setBeforeShutdownCallback(() => {
  console.log("Before shutdown");
});

app.setAfterShutdownCallback(() => {
  console.log("After shutdown");
});

app.start().catch(console.error);
