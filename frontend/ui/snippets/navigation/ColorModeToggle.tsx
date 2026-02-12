import { Button, Text, useColorMode, useColorModeValue } from '@chakra-ui/react';
import React from 'react';

import getDefaultTransitionProps from 'theme/utils/getDefaultTransitionProps';
import IconSvg from 'ui/shared/IconSvg';

interface Props {
  isCollapsed?: boolean;
}

const ColorModeToggle = ({ isCollapsed }: Props) => {
  const { colorMode, toggleColorMode } = useColorMode();

  const bgColor = useColorModeValue('blackAlpha.50', 'whiteAlpha.100');
  const hoverBgColor = useColorModeValue('blackAlpha.100', 'whiteAlpha.200');

  const isDark = colorMode === 'dark';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={ toggleColorMode }
      w="100%"
      justifyContent={{ lg: isCollapsed === false ? 'flex-start' : 'center', xl: isCollapsed ? 'center' : 'flex-start' }}
      px={ 3 }
      py={ 2 }
      h="40px"
      bgColor={ bgColor }
      _hover={{ bgColor: hoverBgColor }}
      borderRadius="base"
      fontWeight={ 500 }
      fontSize="sm"
      { ...getDefaultTransitionProps({ transitionProperty: 'width, padding' }) }
    >
      <IconSvg
        name={ isDark ? 'sun' : 'moon' }
        boxSize={ 5 }
        mr={{ lg: isCollapsed === false ? 3 : 0, xl: isCollapsed ? 0 : 3 }}
        flexShrink={ 0 }
        { ...getDefaultTransitionProps({ transitionProperty: 'margin' }) }
      />
      <Text
        overflow="hidden"
        width={{ lg: isCollapsed === false ? 'auto' : '0px', xl: isCollapsed ? '0px' : 'auto' }}
        opacity={{ lg: isCollapsed === false ? 1 : 0, xl: isCollapsed ? 0 : 1 }}
        { ...getDefaultTransitionProps({ transitionProperty: 'width, opacity' }) }
      >
        { isDark ? 'Light' : 'Dark' }
      </Text>
    </Button>
  );
};

export default React.memo(ColorModeToggle);
