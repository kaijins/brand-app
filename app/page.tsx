'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import '../utils/bulkUpload';  // 追加

const BrandSearch = dynamic(() => import('../components/BrandSearch'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

const Page = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="container mx-auto px-4 bg-gray-900 min-h-screen">
        <BrandSearch />
      </div>
    </Suspense>
  );
};

export default Page;