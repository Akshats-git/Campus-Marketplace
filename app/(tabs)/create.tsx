import { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { createListing, uploadListingImage } from '../../src/services/listings';
import { generateListingFromImage, generateListingDescription, getSuggestedPrice } from '../../src/services/gemini';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, Shadows } from '../../src/constants/colors';
import { CATEGORIES, CONDITIONS } from '../../src/constants/categories';
import { LISTING_IMAGE_LIMIT } from '../../src/constants/config';
import { validateListingTitle, validateListingPrice, validateDescription } from '../../src/utils/validators';
import { ListingCondition } from '../../src/types';

type Step = 'photos' | 'details' | 'pricing' | 'publish';

const STEPS: Step[] = ['photos', 'details', 'pricing', 'publish'];

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile, firebaseUser } = useAuthStore();

  // Step
  const [step, setStep] = useState<Step>('photos');
  const stepIndex = STEPS.indexOf(step);

  // Images
  const [images, setImages] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState<ListingCondition>('good');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Pricing
  const [price, setPrice] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [originalPrice, setOriginalPrice] = useState('');

  // Publishing
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // AI suggestion state
  const [aiSuggesting, setAiSuggesting] = useState(false);

  async function pickImages() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
      orderedSelection: true,
    });
    if (!result.canceled) {
      const newUris = result.assets.map(a => a.uri);
      setImages(prev => [...prev, ...newUris].slice(0, LISTING_IMAGE_LIMIT));
    }
  }

  async function analyzeWithGemini() {
    if (images.length === 0) return;
    setAiLoading(true);
    try {
      const response = await fetch(images[0]);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const suggestion = await generateListingFromImage(base64);
          setTitle(suggestion.title);
          setDescription(suggestion.description);
          setPrice(String(suggestion.suggestedPrice));
          setCategoryId(suggestion.suggestedCategory);
          setTags(suggestion.tags);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('AI Suggestion Ready', 'Review and edit the generated listing before posting.');
        } catch {
          Alert.alert('AI Error', 'Could not analyze image. Please fill in the details manually.');
        } finally {
          setAiLoading(false);
        }
      };
    } catch {
      setAiLoading(false);
      Alert.alert('Error', 'Could not process image.');
    }
  }

  async function handleAiDescription() {
    if (!title || !categoryId) return;
    setAiSuggesting(true);
    try {
      const desc = await generateListingDescription(title, categoryId, condition);
      setDescription(desc);
    } catch {
      Alert.alert('AI Error', 'Could not generate description.');
    } finally {
      setAiSuggesting(false);
    }
  }

  async function handleAiPrice() {
    if (!title || !categoryId) return;
    setAiSuggesting(true);
    try {
      const suggested = await getSuggestedPrice(title, condition, categoryId);
      setPrice(String(suggested));
    } catch {
      Alert.alert('AI Error', 'Could not suggest price.');
    } finally {
      setAiSuggesting(false);
    }
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t]);
      setTagInput('');
    }
  }

  async function handlePublish() {
    if (!userProfile || !firebaseUser) return;

    const titleErr = validateListingTitle(title);
    const descErr = validateDescription(description);
    const priceErr = validateListingPrice(price, isFree);
    if (titleErr || descErr || priceErr) {
      Alert.alert('Validation Error', titleErr ?? descErr ?? priceErr ?? '');
      return;
    }

    setUploading(true);
    try {
      const tempId = `listing_${Date.now()}`;
      const uploadedUrls: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const url = await uploadListingImage(images[i], tempId, i, p => {
          setUploadProgress(((i / images.length) + p / 100 / images.length) * 100);
        });
        uploadedUrls.push(url);
      }

      const id = await createListing({
        title: title.trim(),
        description: description.trim(),
        price: isFree ? 0 : parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        condition,
        categoryId,
        images: uploadedUrls,
        sellerId: userProfile.uid,
        sellerName: userProfile.displayName,
        sellerPhoto: firebaseUser.photoURL,
        sellerRating: userProfile.rating,
        sellerHostel: userProfile.hostel,
        status: 'active',
        tags,
        isFree,
        isNegotiable,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Listed!', 'Your item is now live on Campus Marketplace.', [
        { text: 'View Listing', onPress: () => router.push(`/listing/${id}`) },
        { text: 'Post Another', onPress: () => router.replace('/(tabs)/create') },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to post listing. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function canProceed(): boolean {
    if (step === 'photos') return images.length > 0;
    if (step === 'details') return !!title.trim() && !!description.trim() && !!categoryId;
    if (step === 'pricing') return isFree || !!price.trim();
    return true;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Header */}
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Text style={styles.headerTitle}>Sell an Item</Text>
        <View style={styles.progressRow}>
          {STEPS.map((s, i) => (
            <View key={s} style={styles.progressItem}>
              <View style={[styles.progressDot, i <= stepIndex && styles.progressDotActive]}>
                {i < stepIndex ? (
                  <MaterialCommunityIcons name="check" size={12} color="#fff" />
                ) : (
                  <Text style={styles.progressNum}>{i + 1}</Text>
                )}
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.progressLine, i < stepIndex && styles.progressLineActive]} />
              )}
            </View>
          ))}
        </View>
        <Text style={styles.stepLabel}>
          {step === 'photos' && '📸 Add Photos'}
          {step === 'details' && '📝 Item Details'}
          {step === 'pricing' && '💰 Set Price'}
          {step === 'publish' && '🚀 Review & Publish'}
        </Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* STEP: Photos */}
        {step === 'photos' && (
          <Animated.View entering={FadeInDown.springify()} style={styles.section}>
            {/* AI Analyze button */}
            {images.length > 0 && (
              <Animated.View entering={FadeIn}>
                <Pressable
                  style={[styles.aiBtn, aiLoading && styles.aiBtnDisabled]}
                  onPress={analyzeWithGemini}
                  disabled={aiLoading}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.aiBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {aiLoading ? (
                      <ActivityIndicator size={18} color="#fff" />
                    ) : (
                      <MaterialCommunityIcons name="robot" size={20} color="#fff" />
                    )}
                    <Text style={styles.aiBtnText}>
                      {aiLoading ? 'Analyzing with Gemini AI...' : '✨ Auto-fill with Gemini AI'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            )}

            <View style={styles.imageGrid}>
              {images.map((uri, i) => (
                <Animated.View key={uri} entering={FadeIn.delay(i * 80)} style={styles.imageThumbnail}>
                  <Image source={{ uri }} style={styles.imageThumbImg} contentFit="cover" />
                  {i === 0 && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>MAIN</Text>
                    </View>
                  )}
                  <Pressable
                    style={styles.removeImg}
                    onPress={() => setImages(imgs => imgs.filter((_, j) => j !== i))}
                  >
                    <MaterialCommunityIcons name="close-circle" size={22} color="#fff" />
                  </Pressable>
                </Animated.View>
              ))}

              {images.length < LISTING_IMAGE_LIMIT && (
                <Pressable style={styles.addImageBtn} onPress={pickImages}>
                  <MaterialCommunityIcons name="plus" size={32} color={Colors.primary} />
                  <Text style={styles.addImageText}>Add Photo</Text>
                  <Text style={styles.addImageSub}>{images.length}/{LISTING_IMAGE_LIMIT}</Text>
                </Pressable>
              )}
            </View>
            <Text style={styles.tip}>
              💡 Tip: First photo is the cover. Good photos get 3× more views.
            </Text>
          </Animated.View>
        )}

        {/* STEP: Details */}
        {step === 'details' && (
          <Animated.View entering={FadeInDown.springify()} style={styles.section}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Casio Scientific Calculator FX-991"
                placeholderTextColor={Colors.textHint}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
              <Text style={styles.charCount}>{title.length}/100</Text>
            </View>

            <View style={styles.field}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Description *</Text>
                <Pressable
                  style={[styles.aiInlineBtn, (!title || !categoryId) && styles.aiInlineBtnDisabled]}
                  onPress={handleAiDescription}
                  disabled={!title || !categoryId || aiSuggesting}
                >
                  {aiSuggesting ? (
                    <ActivityIndicator size={12} color={Colors.primary} />
                  ) : (
                    <MaterialCommunityIcons name="robot" size={14} color={Colors.primary} />
                  )}
                  <Text style={styles.aiInlineBtnText}>AI Write</Text>
                </Pressable>
              </View>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe your item's condition, usage, and any defects..."
                placeholderTextColor={Colors.textHint}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={2000}
              />
              <Text style={styles.charCount}>{description.length}/2000</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Category *</Text>
              <View style={styles.catGrid}>
                {CATEGORIES.map(cat => (
                  <Pressable
                    key={cat.id}
                    style={[
                      styles.catOption,
                      { borderColor: cat.color + '40', backgroundColor: cat.backgroundColor },
                      categoryId === cat.id && { borderColor: cat.color, borderWidth: 2 },
                    ]}
                    onPress={() => setCategoryId(cat.id)}
                  >
                    <MaterialCommunityIcons name={cat.icon as any} size={22} color={cat.color} />
                    <Text style={[styles.catOptionText, { color: cat.color }]}>{cat.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Condition *</Text>
              <View style={styles.conditionList}>
                {CONDITIONS.map(c => (
                  <Pressable
                    key={c.id}
                    style={[styles.conditionCard, condition === c.id && styles.conditionCardActive]}
                    onPress={() => setCondition(c.id as ListingCondition)}
                  >
                    <View style={styles.conditionHeader}>
                      <Text style={[styles.conditionName, condition === c.id && { color: Colors.primary }]}>
                        {c.label}
                      </Text>
                      {condition === c.id && (
                        <MaterialCommunityIcons name="check-circle" size={18} color={Colors.primary} />
                      )}
                    </View>
                    <Text style={styles.conditionDesc}>{c.description}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Tags (optional)</Text>
              <View style={styles.tagInputRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="Add a tag..."
                  placeholderTextColor={Colors.textHint}
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={addTag}
                  returnKeyType="done"
                  maxLength={20}
                />
                <Pressable style={styles.addTagBtn} onPress={addTag}>
                  <Text style={styles.addTagBtnText}>Add</Text>
                </Pressable>
              </View>
              <View style={styles.tagsList}>
                {tags.map(t => (
                  <Pressable
                    key={t}
                    style={styles.tag}
                    onPress={() => setTags(prev => prev.filter(x => x !== t))}
                  >
                    <Text style={styles.tagText}>#{t}</Text>
                    <MaterialCommunityIcons name="close" size={12} color={Colors.primary} />
                  </Pressable>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* STEP: Pricing */}
        {step === 'pricing' && (
          <Animated.View entering={FadeInDown.springify()} style={styles.section}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>This is free</Text>
                <Text style={styles.toggleSub}>Check this to give away for free</Text>
              </View>
              <Switch
                value={isFree}
                onValueChange={setIsFree}
                trackColor={{ true: Colors.success }}
                thumbColor="#fff"
              />
            </View>

            {!isFree && (
              <Animated.View entering={FadeIn} style={styles.priceSection}>
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>Asking Price (₹) *</Text>
                  <Pressable
                    style={[styles.aiInlineBtn, (!title || !categoryId) && styles.aiInlineBtnDisabled]}
                    onPress={handleAiPrice}
                    disabled={!title || !categoryId || aiSuggesting}
                  >
                    {aiSuggesting ? (
                      <ActivityIndicator size={12} color={Colors.primary} />
                    ) : (
                      <MaterialCommunityIcons name="robot" size={14} color={Colors.primary} />
                    )}
                    <Text style={styles.aiInlineBtnText}>Suggest Price</Text>
                  </Pressable>
                </View>
                <View style={styles.priceInputWrap}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={[styles.textInput, styles.priceInput]}
                    placeholder="0"
                    placeholderTextColor={Colors.textHint}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Original / MRP (optional)</Text>
                  <View style={styles.priceInputWrap}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={[styles.textInput, styles.priceInput]}
                      placeholder="To show discount"
                      placeholderTextColor={Colors.textHint}
                      value={originalPrice}
                      onChangeText={setOriginalPrice}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Open to negotiation</Text>
                    <Text style={styles.toggleSub}>Buyers can make offers</Text>
                  </View>
                  <Switch
                    value={isNegotiable}
                    onValueChange={setIsNegotiable}
                    trackColor={{ true: Colors.primary }}
                    thumbColor="#fff"
                  />
                </View>
              </Animated.View>
            )}

          </Animated.View>
        )}

        {/* STEP: Publish */}
        {step === 'publish' && (
          <Animated.View entering={FadeInDown.springify()} style={styles.section}>
            <Text style={styles.reviewTitle}>Review your listing</Text>

            {images[0] && (
              <Image source={{ uri: images[0] }} style={styles.reviewImage} contentFit="cover" />
            )}

            <View style={styles.reviewCard}>
              <Text style={styles.reviewItemTitle}>{title}</Text>
              <Text style={styles.reviewPrice}>
                {isFree ? 'Free' : `₹${parseFloat(price).toLocaleString('en-IN')}`}
                {isNegotiable && !isFree && ' · Negotiable'}
              </Text>
              <Text style={styles.reviewDesc} numberOfLines={3}>{description}</Text>
              <View style={styles.reviewMeta}>
                <View style={styles.reviewMetaItem}>
                  <MaterialCommunityIcons name="tag" size={14} color={Colors.textHint} />
                  <Text style={styles.reviewMetaText}>
                    {CATEGORIES.find(c => c.id === categoryId)?.name ?? categoryId}
                  </Text>
                </View>
                <View style={styles.reviewMetaItem}>
                  <MaterialCommunityIcons name="star-outline" size={14} color={Colors.textHint} />
                  <Text style={styles.reviewMetaText}>
                    {CONDITIONS.find(c => c.id === condition)?.label}
                  </Text>
                </View>
                <View style={styles.reviewMetaItem}>
                  <MaterialCommunityIcons name="image-multiple" size={14} color={Colors.textHint} />
                  <Text style={styles.reviewMetaText}>{images.length} photo{images.length !== 1 ? 's' : ''}</Text>
                </View>
              </View>
            </View>

            {uploading && (
              <View style={styles.uploadProgress}>
                <Text style={styles.uploadText}>Uploading... {Math.round(uploadProgress)}%</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                </View>
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {stepIndex > 0 && (
          <Pressable
            style={styles.backBtn}
            onPress={() => setStep(STEPS[stepIndex - 1])}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          disabled={!canProceed() || uploading}
          onPress={step === 'publish' ? handlePublish : () => setStep(STEPS[stepIndex + 1])}
        >
          {uploading ? (
            <ActivityIndicator size={20} color="#fff" />
          ) : (
            <Text style={styles.nextBtnText}>
              {step === 'publish' ? 'Publish Listing' : 'Continue →'}
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  progressItem: { flexDirection: 'row', alignItems: 'center' },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: { backgroundColor: '#fff' },
  progressNum: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  progressLine: { width: 40, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 4 },
  progressLineActive: { backgroundColor: '#fff' },
  stepLabel: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
  content: { padding: 20, gap: 8 },
  section: { gap: 20 },
  aiBtn: { marginBottom: 8 },
  aiBtnDisabled: { opacity: 0.6 },
  aiBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 16,
    justifyContent: 'center',
  },
  aiBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imageThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  imageThumbImg: { width: '100%', height: '100%' },
  primaryBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  removeImg: { position: 'absolute', top: 4, right: 4 },
  addImageBtn: {
    width: 100,
    height: 100,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '08',
  },
  addImageText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  addImageSub: { fontSize: 10, color: Colors.textHint },
  tip: { fontSize: 13, color: Colors.textHint, backgroundColor: Colors.infoLight, padding: 12, borderRadius: 10 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldSub: { fontSize: 12, color: Colors.textHint, marginTop: -4 },
  charCount: { fontSize: 11, color: Colors.textHint, textAlign: 'right' },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  aiInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.primary + '15',
    borderRadius: 8,
  },
  aiInlineBtnDisabled: { opacity: 0.4 },
  aiInlineBtnText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catOption: {
    width: '30%',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
  },
  catOptionText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  conditionList: { gap: 8 },
  conditionCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 4,
  },
  conditionCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  conditionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  conditionName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  conditionDesc: { fontSize: 13, color: Colors.textHint },
  tagInputRow: { flexDirection: 'row', gap: 10 },
  addTagBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTagBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  tagsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: Colors.primary + '15',
    borderRadius: 10,
  },
  tagText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleInfo: { gap: 2 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  toggleSub: { fontSize: 13, color: Colors.textHint },
  priceSection: { gap: 16 },
  priceInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currencySymbol: { fontSize: 22, fontWeight: '700', color: Colors.textSecondary },
  priceInput: { flex: 1, fontSize: 22, fontWeight: '700' },
  reviewTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  reviewImage: { width: '100%', height: 240, borderRadius: 20 },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 10,
    ...Shadows.medium,
  },
  reviewItemTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  reviewPrice: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  reviewDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  reviewMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  reviewMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reviewMetaText: { fontSize: 13, color: Colors.textHint },
  uploadProgress: { gap: 8 },
  uploadText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  progressBar: { height: 6, borderRadius: 3, backgroundColor: Colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  backBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  backBtnText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  nextBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  nextBtnDisabled: { backgroundColor: Colors.textHint },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
