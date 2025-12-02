import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export const SkeletonLoader = ({ width, height, style, borderRadius = 8 }) => {
  const { isDarkMode } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const backgroundColor = isDarkMode ? '#374151' : '#E5E7EB';

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const DashboardSkeleton = () => {
    return (
        <View style={{gap: 20}}>
            {/* Header Skeleton */}
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                <View>
                    <SkeletonLoader width={150} height={24} style={{marginBottom: 5}} />
                    <SkeletonLoader width={100} height={16} />
                </View>
                <SkeletonLoader width={40} height={40} borderRadius={20} />
            </View>

            {/* Balance Card Skeleton */}
            <SkeletonLoader width="100%" height={180} borderRadius={24} />

            {/* Actions Skeleton */}
            <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                <SkeletonLoader width={100} height={100} borderRadius={16} />
                <SkeletonLoader width={100} height={100} borderRadius={16} />
                <SkeletonLoader width={100} height={100} borderRadius={16} />
            </View>

            {/* Transactions Skeleton */}
            <View>
                <SkeletonLoader width={200} height={24} style={{marginBottom: 15}} />
                <SkeletonLoader width="100%" height={70} style={{marginBottom: 10}} borderRadius={16} />
                <SkeletonLoader width="100%" height={70} style={{marginBottom: 10}} borderRadius={16} />
                <SkeletonLoader width="100%" height={70} style={{marginBottom: 10}} borderRadius={16} />
            </View>
        </View>
    )
}
