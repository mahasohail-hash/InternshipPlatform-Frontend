// app/themeConfig.ts
import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    colorPrimary: '#00b96b', // Example primary color
    borderRadius: 2,
  },
  components: {
    Button: {
      colorPrimary: '#00b96b',
    },
    // Customize other components as needed
  },
};

export default theme;