/* eslint-disable */
// @ts-nocheck


import { StoreInit } from "flowbite-react/store/init";
import React from "react";

export const CONFIG = {
  dark: true,
  prefix: "",
  version: 4,
};

export function ThemeInit() {
  return <StoreInit {...CONFIG} />;
}

ThemeInit.displayName = "ThemeInit";