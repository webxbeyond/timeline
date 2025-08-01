"use client";
import { signIn } from 'next-auth/react';
import { FcGoogle } from 'react-icons/fc';
import { signOut } from 'next-auth/react';
import { FiLogOut } from 'react-icons/fi';

import { motion } from 'framer-motion';

export function LoginButton({ className = "" }: { className?: string }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.05, boxShadow: '0 4px 24px #6366f133', borderColor: '#6366f1' }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 120 }}
      className={`flex items-center gap-2 px-6 py-3 bg-white rounded-xl shadow-lg hover:bg-gray-100 dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 font-semibold text-lg ${className}`}
      onClick={() => signIn('google')}
      style={{ cursor: 'pointer' }}
    >
      <FcGoogle className="w-6 h-6" />
      Sign in with Google
    </motion.button>
  );
}

export function LogoutButton({ className = "" }: { className?: string }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.05, boxShadow: '0 4px 24px #ef444433', borderColor: '#ef4444' }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 120 }}
      className={`flex items-center gap-2 px-6 py-3 bg-white rounded-xl shadow-lg hover:bg-gray-100 dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 font-semibold text-lg ${className}`}
      onClick={() => signOut()}
      style={{ cursor: 'pointer' }}
    >
      <FiLogOut className="w-6 h-6" />
      Log out
    </motion.button>
  );
}
