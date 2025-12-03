'use client';

import React from 'react';
import { Spin } from 'antd';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spin size="large">
        <div style={{ marginTop: 16, textAlign: 'center' }}></div>
      </Spin>
    </div>
  );
}
