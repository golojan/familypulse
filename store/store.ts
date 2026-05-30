import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { coreApi } from "./api/core.api";

export function makeStore() {
  const store = configureStore({
    reducer: {
      [coreApi.reducerPath]: coreApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(coreApi.middleware),
  });

  setupListeners(store.dispatch);

  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
