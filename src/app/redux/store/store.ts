import { configureStore } from "@reduxjs/toolkit";
import profileReducer from "../searchProfile/profileSlice";
import legalExpertReducer from '../legalExpert/legalExpertSlice';
import clientReducer from '../client/clientSlice';
import ecourtsSearchReducer from '../ecourtsSearch/ecourtsSearchSlice';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';

const profilePersistConfig = {
  key: 'profile',
  storage,
  whitelist: ['id', 'name', 'role', 'experience', 'location', 'rating', 'reviews', 'fees', 'image', 'portfolios', 'organizationRole', 'organizationId', 'userId'],
};

const legalExpertPersistConfig = {
  key: 'legalExpert',
  storage,
  whitelist: ['data'],
};

const clientPersistConfig = {
  key: 'client',
  storage,
  whitelist: ['data']
};

const ecourtsSearchPersistConfig = {
  key: 'ecourtsSearch',
  storage,
  whitelist: ['usedCount', 'lastResetMonth'],
};

const rootReducer = combineReducers({
  profile: persistReducer(profilePersistConfig, profileReducer),
  legalExpert: persistReducer(legalExpertPersistConfig, legalExpertReducer),
  client: persistReducer(clientPersistConfig, clientReducer),
  ecourtsSearch: persistReducer(ecourtsSearchPersistConfig, ecourtsSearchReducer),
});

export const makeStore = () => {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
  });

  const persistor = persistStore(store);
  return { store, persistor };
}

export type AppStore = ReturnType<typeof makeStore>['store'];
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export const { store, persistor } = makeStore();