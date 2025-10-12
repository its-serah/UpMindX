import React from 'react';
import { StatusBar } from 'expo-status-bar';
import TechTokFeed from '@/components/TechTokFeed';


export default function HomeScreen() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#000" />
      <TechTokFeed />
    </>
  );
};
