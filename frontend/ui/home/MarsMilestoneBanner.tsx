import { Alert, AlertDescription, AlertIcon, AlertTitle, Flex, Skeleton, Text } from '@chakra-ui/react';
import React from 'react';

import { route } from 'nextjs-routes';

import config from 'configs/app';
import useApiQuery from 'lib/api/useApiQuery';
import { formatMarsDuration, isMarsChain, marsMilestoneState, MARS_MILESTONE_BLOCK } from 'lib/mars/milestone';
import { HOMEPAGE_STATS } from 'stubs/stats';
import LinkInternal from 'ui/shared/links/LinkInternal';

const MarsMilestoneBanner = () => {
  const enabled = isMarsChain(config.chain.id);
  const { data, isPlaceholderData } = useApiQuery('stats', {
    queryOptions: {
      enabled,
      placeholderData: HOMEPAGE_STATS,
    },
  });

  if (!enabled) {
    return null;
  }

  const tip = Number(data?.total_blocks);
  if (isPlaceholderData || !Number.isFinite(tip) || tip <= 0) {
    return <Skeleton h={{ base: '72px', lg: '48px' }} w="100%" borderRadius="md"/>;
  }

  const state = marsMilestoneState(tip);
  const countdownHref = route({ pathname: '/block/countdown/[height]', query: { height: String(MARS_MILESTONE_BLOCK) } });

  if (state.reached) {
    return (
      <Alert status="success" colorScheme="green" py={ 3 } borderRadius="md">
        <AlertIcon display={{ base: 'none', lg: 'flex' }}/>
        <Flex flexDir="column" gap={ 1 }>
          <AlertTitle>7,000,000+ blocks</AlertTitle>
          <AlertDescription>
            Mars Credit has passed seven million blocks. Live tip is { tip.toLocaleString() }.
          </AlertDescription>
        </Flex>
      </Alert>
    );
  }

  return (
    <Alert status="info" colorScheme="orange" py={ 3 } borderRadius="md">
      <AlertIcon display={{ base: 'none', lg: 'flex' }}/>
      <Flex flexDir={{ base: 'column', md: 'row' }} gap={ 2 } alignItems={{ md: 'center' }} justifyContent="space-between" w="100%">
        <Flex flexDir="column" gap={ 0.5 }>
          <AlertTitle>Countdown to block 7,000,000</AlertTitle>
          <Text fontSize="sm">
            { state.remaining.toLocaleString() } blocks remaining
            { ' · ' }
            about { formatMarsDuration(state.etaSeconds) } at ~2s/block
            { ' · ' }
            tip { tip.toLocaleString() }
          </Text>
        </Flex>
        <LinkInternal href={ countdownHref } fontWeight={ 600 } whiteSpace="nowrap">
          Open block countdown
        </LinkInternal>
      </Flex>
    </Alert>
  );
};

export default React.memo(MarsMilestoneBanner);
