import { combineReducers, configureStore } from "@reduxjs/toolkit"
import authReducer, { logout } from "./slices/authSlice"

const appReducer = combineReducers({ auth: authReducer })

const rootReducer: typeof appReducer = (state, action) =>
  appReducer(action.type === logout.fulfilled.type ? undefined : state, action)

export const store = configureStore({ reducer: rootReducer })