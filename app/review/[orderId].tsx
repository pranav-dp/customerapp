import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';
import { textStyles } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';
import { getOrder, Order, OrderItem } from '../../services/orders';
import { createReview, getReview, Review } from '../../services/reviews';
import { submitItemRating, getItemRatingsForOrder } from '../../services/itemRatings';
import { StarRating } from '../../components/StarRating';

// Separate component to handle key prop properly in React 19
function OrderItemRow({ 
  item, 
  itemRating, 
  onRatingChange, 
  readonly,
  colors,
  key: _key 
}: { 
  item: OrderItem; 
  itemRating: number;
  onRatingChange: (rating: number) => void;
  readonly: boolean;
  colors: ReturnType<typeof useColors>;
  key?: string;
}) {
  return (
    <View style={[styles.orderItem, { borderBottomColor: colors.gray100 }]}>
      <View style={styles.orderItemTop}>
        <View style={styles.orderItemLeft}>
          <View style={[styles.vegIndicator, item.isVeg ? { borderColor: colors.veg, backgroundColor: colors.veg } : { borderColor: colors.nonVeg, backgroundColor: colors.nonVeg }]} />
          <Text style={[styles.orderItemName, { color: colors.textPrimary }]}>{item.name}</Text>
        </View>
        <View style={styles.orderItemRight}>
          <Text style={[styles.orderItemQty, { color: colors.textSecondary }]}>x{item.quantity}</Text>
          <Text style={[styles.orderItemPrice, { color: colors.textPrimary }]}>₹{item.price * item.quantity}</Text>
        </View>
      </View>
      <View style={styles.itemRatingRow}>
        <Text style={[styles.itemRatingLabel, { color: colors.textSecondary }]}>Rate this item:</Text>
        <StarRating 
          rating={itemRating} 
          onRatingChange={onRatingChange}
          size={18}
          readonly={readonly}
        />
      </View>
    </View>
  );
}

export default function ReviewScreen() {
  const colors = useColors();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { user, customer } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState('');
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [itemRatings, setItemRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!orderId) return;
      const result = await getOrder(orderId);
      if (result.success && result.data) {
        setOrder(result.data);
        // Check if already reviewed
        if (result.data.isReviewed && result.data.reviewId) {
          const reviewResult = await getReview(result.data.reviewId);
          if (reviewResult.success && reviewResult.data) {
            setExistingReview(reviewResult.data);
            setRating(reviewResult.data.rating);
            setDescription(reviewResult.data.description);
          }
        }
        // Fetch existing item ratings for this order
        if (user) {
          const itemRatingsResult = await getItemRatingsForOrder(orderId, user.uid);
          if (itemRatingsResult.success && itemRatingsResult.data) {
            setItemRatings(itemRatingsResult.data);
          }
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [orderId]);

  const handleRatingChange = (newRating: number) => {
    if (existingReview) return; // Don't allow changes if already reviewed
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(newRating);
  };

  const handleItemRatingChange = (itemId: string, newRating: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItemRatings(prev => ({ ...prev, [itemId]: newRating }));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating.');
      return;
    }
    if (!order || !user || !customer) return;

    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const reviewData: any = {
        orderId: order.id!,
        orderNumber: order.orderNumber,
        customerId: user.uid,
        customerName: customer.name || 'Anonymous',
        username: customer.username || 'user',
        restaurantId: order.restaurantId,
        restaurantName: order.restaurantName,
        rating,
        description: description.trim() || '', // Empty string if no description
        items: order.items.map(i => ({ name: i.name, quantity: i.quantity })),
      };

      // Only add photoUrl if it exists (don't send undefined to Firestore)
      // photoUrl will be added here when photo upload is implemented

      const result = await createReview(reviewData);
      
      if (result.success) {
        // Submit item ratings (if any)
        const itemRatingPromises = Object.entries(itemRatings)
          .filter(([_, rating]) => rating > 0)
          .map(([itemId, itemRating]) => {
            const item = order.items.find(i => i.id === itemId);
            return submitItemRating({
              itemId,
              itemName: item?.name || '',
              restaurantId: order.restaurantId,
              customerId: user.uid,
              orderId: order.id!,
              rating: itemRating,
            });
          });
        
        await Promise.all(itemRatingPromises);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Review Posted!', 'Thank you for your feedback.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to post review.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.gray100 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Write a Review</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const orderDate = order.createdAt instanceof Date 
    ? order.createdAt 
    : (order.createdAt as any)?.toDate?.() || new Date();
  const itemsSummary = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
  const canSubmit = rating > 0 && !existingReview;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.gray100 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{existingReview ? 'Your Review' : 'Write a Review'}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Card - Tappable to expand */}
        <TouchableOpacity 
          style={[styles.orderCard, { backgroundColor: colors.white }]} 
          onPress={() => setShowOrderDetails(!showOrderDetails)}
          activeOpacity={0.7}
        >
          <View style={styles.orderCardHeader}>
            <View style={styles.orderCardLeft}>
              <View style={[styles.restaurantIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="restaurant" size={20} color={colors.primary} />
              </View>
              <View style={styles.orderCardInfo}>
                <Text style={[styles.restaurantName, { color: colors.textPrimary }]}>{order.restaurantName}</Text>
                <Text style={[styles.orderNumber, { color: colors.primary }]}>Order #{order.orderNumber}</Text>
              </View>
            </View>
            <View style={styles.orderCardRight}>
              <Text style={[styles.orderAmount, { color: colors.textPrimary }]}>₹{order.totalAmount}</Text>
              <Ionicons 
                name={showOrderDetails ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.gray400} 
              />
            </View>
          </View>
          
          <View style={styles.orderCardMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                {orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                {orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>

          {!showOrderDetails && (
            <Text style={[styles.orderItemsPreview, { color: colors.textSecondary, borderTopColor: colors.gray100 }]} numberOfLines={1}>{itemsSummary}</Text>
          )}
        </TouchableOpacity>

        {/* Expanded Order Details */}
        {showOrderDetails && (
          <View style={[styles.orderDetails, { backgroundColor: colors.white }]}>
            <Text style={[styles.orderDetailsTitle, { color: colors.textPrimary }]}>Order Items</Text>
            <Text style={[styles.orderDetailsSubtitle, { color: colors.textTertiary }]}>Rate each item (optional)</Text>
            {order.items.map((item, index) => (
              <OrderItemRow 
                key={`item-${index}`} 
                item={item}
                itemRating={itemRatings[item.id] || 0}
                onRatingChange={(rating) => handleItemRatingChange(item.id, rating)}
                readonly={!!existingReview}
                colors={colors}
              />
            ))}
            <View style={styles.orderTotal}>
              <Text style={[styles.orderTotalLabel, { color: colors.textPrimary }]}>Total</Text>
              <Text style={[styles.orderTotalAmount, { color: colors.primary }]}>₹{order.totalAmount}</Text>
            </View>
          </View>
        )}

        {/* Already Reviewed Banner */}
        {existingReview && (
          <View style={[styles.reviewedBanner, { backgroundColor: colors.successLight }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.reviewedBannerText, { color: colors.success }]}>You've already reviewed this order</Text>
          </View>
        )}

        {/* Rating Section */}
        <View style={[styles.section, { backgroundColor: colors.white }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>How was your experience?</Text>
          <View style={styles.ratingContainer}>
            <StarRating 
              rating={rating} 
              onRatingChange={handleRatingChange} 
              size={40}
              readonly={!!existingReview}
            />
          </View>
          {rating > 0 && (
            <Text style={[styles.ratingLabel, { color: colors.textSecondary }]}>
              {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
            </Text>
          )}
        </View>

        {/* Description Section */}
        <View style={[styles.section, { backgroundColor: colors.white }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Tell us about your experience (Optional)</Text>
          <TextInput
            style={[styles.textInput, { color: colors.textPrimary, backgroundColor: colors.gray50 }, existingReview && { backgroundColor: colors.gray100, color: colors.textSecondary }]}
            placeholder="What did you like or dislike? How was the food quality?"
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
            editable={!existingReview}
          />
        </View>

        {/* Photo Section - Coming Soon */}
        <View style={[styles.section, { backgroundColor: colors.white }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Add Photo (Optional)</Text>
          <View style={[styles.addPhotoBtn, { backgroundColor: colors.gray50, borderColor: colors.gray200 }]}>
            <Ionicons name="camera-outline" size={24} color={colors.textTertiary} />
            <Text style={[styles.addPhotoText, { color: colors.textTertiary }]}>Photo upload coming soon</Text>
          </View>
        </View>

        {/* Submit Button */}
        {!existingReview && (
          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: colors.primary }, !canSubmit && { backgroundColor: colors.gray300 }]}
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={[styles.submitBtnText, { color: colors.white }]}>Post Review</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { ...textStyles.h4, marginTop: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...textStyles.h3 },
  content: { flex: 1, padding: spacing.lg },
  
  // Order Card Styles
  orderCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  restaurantIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderCardInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  restaurantName: { ...textStyles.h4 },
  orderNumber: { ...textStyles.caption, marginTop: 2 },
  orderCardRight: {
    alignItems: 'flex-end',
  },
  orderAmount: { ...textStyles.h4 },
  orderCardMeta: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: { ...textStyles.caption },
  orderItemsPreview: {
    ...textStyles.body,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  
  // Order Details Styles
  orderDetails: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  orderDetailsTitle: {
    ...textStyles.label,
    marginBottom: spacing.xs,
  },
  orderDetailsSubtitle: {
    ...textStyles.caption,
    marginBottom: spacing.md,
  },
  orderItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  orderItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vegIndicator: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1.5,
    marginRight: spacing.sm,
  },
  orderItemName: { ...textStyles.body, flex: 1 },
  orderItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  orderItemQty: { ...textStyles.body },
  orderItemPrice: { ...textStyles.label, minWidth: 60, textAlign: 'right' },
  itemRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  itemRatingLabel: {
    ...textStyles.caption,
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  orderTotalLabel: { ...textStyles.label },
  orderTotalAmount: { ...textStyles.h4 },
  
  // Reviewed Banner
  reviewedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  reviewedBannerText: {
    ...textStyles.label,
  },
  
  // Section Styles
  section: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: { ...textStyles.label, marginBottom: spacing.md },
  ratingContainer: { alignItems: 'center', paddingVertical: spacing.md },
  ratingLabel: { ...textStyles.body, textAlign: 'center', marginTop: spacing.sm },
  textInput: {
    ...textStyles.body,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 120,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  addPhotoText: { ...textStyles.body },
  submitBtn: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  submitBtnText: { ...textStyles.label },
});
