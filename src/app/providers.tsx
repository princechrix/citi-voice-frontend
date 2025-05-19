'use client';
import React from 'react';
import { Next13ProgressBar } from 'next13-progressbar';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <Toaster position="top-center" richColors closeButton />
        {children}
        <Next13ProgressBar height="4px" color="#0A2FFF" options={{ showSpinner: false }} showOnShallow />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default Providers;