import React from 'react';
// Fix wrong statusbar color when modal is up on iOS, for Light Mode
import { StatusBar } from 'expo-status-bar';
export default function () {
  return <StatusBar style="inverted" animated />;
}
