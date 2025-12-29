# Review Feature Implementation Plan

## Overview
Implement a comprehensive review system that allows customers to post reviews for their orders, view restaurant reviews, and manage their own reviews. Restaurant owners can view reviews in the hotel app.

---

## Analysis

### What's Correct in the Original Idea
1. **Star rating system** - 5-star interactive rating with visual fill feedback
2. **Photo upload** - Users can attach photos of their orders
3. **Review filtering** - Filter by star rating and recency
4. **Rating calculation** - Average rating computed from all reviews
5. **Review management** - Users can view and delete their reviews
6. **Order-based reviews** - Reviews are tied to specific orders
7. **Dual-app integration** - Reviews visible in both customer and hotel apps

### Database Structure

#### New `reviews` Collection
```typescript
interface Review {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  username: string;
  restaurantId: string;
  restaurantName: string;
  rating: number; // 1-5
  description: string;
  photoUrl?: string;
  items: { name: string; quantity: number }[]; // Order items summary
  createdAt: Date;
  updatedAt: Date;
}
```

#### Updated `restaurants` Collection
```typescript
// Add to existing restaurant document
{
  rating: number;        // Average rating (0-5)
  reviewCount: number;   // Total number of reviews
}
```

#### Updated `orders` Collection
```typescript
// Add to existing order document
{
  isReviewed: boolean;   // Whether order has been reviewed
  reviewId?: string;     // Reference to review if exists
}
```

---

## Implementation Tasks

### Phase 1: Database & Service Layer

#### 1.1 Create Reviews Service (`services/reviews.ts`)
- [ ] `createReview(reviewData)` - Create new review
- [ ] `getReviewsByRestaurant(restaurantId, filters?)` - Get restaurant reviews with optional filters
- [ ] `getReviewsByCustomer(customerId)` - Get all reviews by a customer
- [ ] `deleteReview(reviewId)` - Delete a review
- [ ] `updateRestaurantRating(restaurantId)` - Recalculate and update restaurant rating
- [ ] `markOrderAsReviewed(orderId, reviewId)` - Update order with review reference

#### 1.2 Update Orders Service
- [ ] Add `isReviewed` field handling
- [ ] Add function to get reviewable orders (paid, not reviewed)

---

### Phase 2: Customer App - Review Creation

#### 2.1 Create Review Screen (`app/review/[orderId].tsx`)
- [ ] Star rating component (5 interactive stars) - REQUIRED
- [ ] Description text input (multiline) - REQUIRED
- [ ] Photo picker/camera integration - OPTIONAL (not mandatory)
- [ ] Clear indication that photo is optional ("Add Photo (Optional)")
- [ ] Order summary display
- [ ] Post Review button (enabled when rating and description provided)
- [ ] Loading and success states
- [ ] Validation: only require rating (1-5) and description (non-empty)

#### 2.2 Star Rating Component (`components/StarRating.tsx`)
- [ ] Interactive star selection
- [ ] Visual fill animation
- [ ] Read-only mode for display
- [ ] Configurable size

---

### Phase 3: Customer App - Profile Reviews Section

#### 3.1 Update Profile Page (`app/(tabs)/profile.tsx`)
- [ ] Add "Your Reviews" menu item under Account section
- [ ] Add "Review an Order" section with reviewable orders list
- [ ] Show reviewed/not reviewed status on order cards

#### 3.2 Create Your Reviews Screen (`app/your-reviews.tsx`)
- [ ] List all user's reviews
- [ ] Review card with rating, description, photo thumbnail
- [ ] Delete review functionality with confirmation
- [ ] Empty state for no reviews

#### 3.3 Create Reviewable Orders Screen (`app/reviewable-orders.tsx`)
- [ ] List orders that can be reviewed (paid, not reviewed)
- [ ] Order cards with "Reviewed" / "Not Reviewed" badge
- [ ] Tap to view order details
- [ ] "Review Order" button on order detail page

#### 3.4 Update Order Detail Page (`app/order/[id].tsx`)
- [ ] Add "Review Order" button for reviewable orders
- [ ] Show "Already Reviewed" badge if reviewed
- [ ] Navigate to review screen on button press

---

### Phase 4: Customer App - Restaurant Reviews Display

#### 4.1 Create Reviews Section Component (`components/ReviewCard.tsx`)
- [ ] Review card with username, rating, description, photo
- [ ] Order items summary
- [ ] Timestamp display

#### 4.2 Create Restaurant Reviews Screen (`app/restaurant-reviews/[restaurantId].tsx`)
- [ ] Header with restaurant name and average rating
- [ ] Filter tabs: All, 5★, 4★, 3★, 2★, 1★, Recent
- [ ] List of review cards
- [ ] Empty state

#### 4.3 Update Restaurant Detail Page (`app/restaurant/[id].tsx`)
- [ ] Add rating display in header near restaurant name
- [ ] Add tappable "Reviews" section/badge near restaurant name
- [ ] When tapped, navigate to restaurant reviews screen
- [ ] Show star rating and review count (e.g., "★★★★☆ 4.2 (128 reviews)")
- [ ] Make it visually clear that the reviews section is tappable

#### 4.4 Update Restaurant Card (Home Page)
- [ ] Add star rating display
- [ ] Show rating even if 0 (with "No reviews yet" text)
- [ ] Review count display

---

### Phase 5: Hotel App - Reviews Section

#### 5.1 Add Reviews Tab (`hotelapp/app/(tabs)/reviews.tsx`)
- [ ] List all reviews for the restaurant
- [ ] Filter by rating
- [ ] Sort by recent/oldest
- [ ] Review cards with customer info

#### 5.2 Update Tab Layout (`hotelapp/app/(tabs)/_layout.tsx`)
- [ ] Add Reviews tab icon and route

#### 5.3 Create Review Detail View
- [ ] Full review display
- [ ] Customer info
- [ ] Order details
- [ ] Photo full view

---

## File Changes Summary

### Customer App - New Files
| File | Description |
|------|-------------|
| `services/reviews.ts` | Reviews service functions |
| `components/StarRating.tsx` | Reusable star rating component |
| `components/ReviewCard.tsx` | Review display card |
| `app/review/[orderId].tsx` | Create review screen |
| `app/your-reviews.tsx` | User's reviews list |
| `app/reviewable-orders.tsx` | Orders available for review |
| `app/restaurant-reviews/[restaurantId].tsx` | Restaurant reviews list |

### Customer App - Modified Files
| File | Changes |
|------|---------|
| `services/orders.ts` | Add isReviewed field handling |
| `app/(tabs)/profile.tsx` | Add reviews sections |
| `app/order/[id].tsx` | Add review button |
| `app/restaurant/[id].tsx` | Add rating display, reviews link |
| `app/(tabs)/index.tsx` | Update RestaurantCard with rating |

### Hotel App - New Files
| File | Description |
|------|-------------|
| `app/(tabs)/reviews.tsx` | Reviews tab screen |

### Hotel App - Modified Files
| File | Changes |
|------|---------|
| `app/(tabs)/_layout.tsx` | Add reviews tab |

---

## UI Mockups (Text)

### Star Rating Component
```
Interactive (Create Review):
☆ ☆ ☆ ☆ ☆  (empty)
★ ★ ★ ☆ ☆  (3 stars selected - filled gold)

Read-only (Display):
★★★★☆ 4.2 (128 reviews)
```

### Review Screen
```
┌─────────────────────────────────────────┐
│ ← Write a Review                        │
├─────────────────────────────────────────┤
│                                         │
│ Order #ABC123 at Cafe Mocha             │
│ 2x Latte, 1x Croissant                  │
│                                         │
│ How was your experience?                │
│                                         │
│      ★ ★ ★ ★ ☆                         │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Tell us about your experience...    │ │
│ │                                     │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📷 Add Photo (Optional)             │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │         Post Review                 │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Restaurant Detail Header with Reviews
```
┌─────────────────────────────────────────┐
│ ←                                    ♡  │
├─────────────────────────────────────────┤
│ Cafe Mocha                              │
│ Best coffee on campus                   │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ★★★★☆ 4.2 (128 reviews)          > │ │
│ └─────────────────────────────────────┘ │
│         ↑ Tappable - opens reviews      │
│                                         │
│ ● Open · Closes at 10:00 PM             │
│ 🍽️ 15 items available                   │
└─────────────────────────────────────────┘
```

### Restaurant Card with Rating
```
┌─────────────────────────────────────────┐
│ 🏪  Cafe Mocha                          │
│     15 items available                  │
│     ● Open now                          │
│     ★★★★☆ 4.2 (128)              >     │
└─────────────────────────────────────────┘
```

### Review Card
```
┌─────────────────────────────────────────┐
│ @johndoe                    ★★★★★      │
│ 2 days ago                              │
├─────────────────────────────────────────┤
│ Amazing food! The latte was perfect     │
│ and the croissant was fresh.            │
│                                         │
│ ┌─────────┐                             │
│ │  📷     │ 2x Latte, 1x Croissant      │
│ └─────────┘                             │
└─────────────────────────────────────────┘
```

### Profile - Reviews Section
```
┌─────────────────────────────────────────┐
│ Account                                 │
├─────────────────────────────────────────┤
│ 👤 Edit Profile                      >  │
│ 📊 Spending Insights                 >  │
│ 👥 Friends                           >  │
│ ⭐ Your Reviews (5)                  >  │
├─────────────────────────────────────────┤
│ Review an Order                         │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ #ABC123 - Cafe Mocha    Not Reviewed│ │
│ │ 2x Latte, 1x Croissant              │ │
│ │ Dec 28, 2:30 PM              ₹450   │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ #XYZ789 - Pizza Palace    Reviewed ✓│ │
│ │ 1x Margherita                       │ │
│ │ Dec 25, 7:00 PM              ₹350   │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Restaurant Reviews Screen (Filters)
```
┌─────────────────────────────────────────┐
│ ← Cafe Mocha Reviews                    │
│ ★★★★☆ 4.2 average • 128 reviews        │
├─────────────────────────────────────────┤
│ [All] [5★] [4★] [3★] [2★] [1★] [Recent] │
├─────────────────────────────────────────┤
│ (Review cards list...)                  │
└─────────────────────────────────────────┘
```

---

## Rating Calculation

```typescript
// Calculate average rating for a restaurant
const calculateAverageRating = (reviews: Review[]): number => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10; // Round to 1 decimal
};

// Update restaurant rating after review change
const updateRestaurantRating = async (restaurantId: string) => {
  const reviews = await getReviewsByRestaurant(restaurantId);
  const rating = calculateAverageRating(reviews);
  const reviewCount = reviews.length;
  await updateRestaurant(restaurantId, { rating, reviewCount });
};
```

---

## Photo Upload Strategy

Photo upload is **OPTIONAL** - users can post reviews without photos for a better experience.

Using Expo ImagePicker + Firebase Storage (when user chooses to add photo):
1. User optionally selects photo from gallery or takes new photo
2. Image is compressed/resized for upload
3. Upload to Firebase Storage under `reviews/{reviewId}/photo.jpg`
4. Store download URL in review document
5. If no photo selected, `photoUrl` field is omitted or null

---

## Testing Checklist

### Review Creation
- [ ] Star rating selection works
- [ ] Description input works
- [ ] Photo picker works
- [ ] Review posts successfully
- [ ] Order marked as reviewed
- [ ] Restaurant rating updates

### Review Display
- [ ] Reviews show on restaurant page
- [ ] Filters work correctly
- [ ] Rating displays on restaurant cards
- [ ] User's reviews show in profile

### Review Management
- [ ] Delete review works
- [ ] Rating recalculates after delete
- [ ] Order marked as not reviewed after delete

### Hotel App
- [ ] Reviews tab shows all reviews
- [ ] Filters work
- [ ] Review details display correctly

---

## Estimated Effort

| Phase | Time |
|-------|------|
| Phase 1: Database & Service | 1-2 hours |
| Phase 2: Review Creation | 2-3 hours |
| Phase 3: Profile Reviews | 2-3 hours |
| Phase 4: Restaurant Reviews | 2-3 hours |
| Phase 5: Hotel App | 1-2 hours |
| Testing & Polish | 1-2 hours |

**Total: ~10-15 hours**

---

## Dependencies

- `expo-image-picker` - For photo selection
- `firebase/storage` - For photo upload (if not already configured)

---

## Notes

1. **Firestore Indexes Required:**
   - `reviews`: `restaurantId` + `createdAt` (desc)
   - `reviews`: `customerId` + `createdAt` (desc)
   - `reviews`: `restaurantId` + `rating` + `createdAt` (desc)

2. **Security Rules:**
   - Users can only create reviews for their own orders
   - Users can only delete their own reviews
   - Anyone can read reviews

3. **Edge Cases:**
   - Order already reviewed - show "Already Reviewed" badge
   - Restaurant with no reviews - show "No reviews yet" with 0 stars
   - Photo upload failure - continue posting without photo (photo is optional)
   - Review without photo - display review card without photo section

4. **Review Validation:**
   - Rating: Required (1-5 stars)
   - Description: Required (non-empty, trimmed)
   - Photo: Optional (can be null/undefined)
