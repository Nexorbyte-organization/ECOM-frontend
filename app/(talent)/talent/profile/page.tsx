'use client';

import { toast } from '@/lib/toast';

import ContentSkeleton, { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import {
    getTalentProfileByUserId, updateTalentProfile, isVerifiedTalent, getTalentEventHistory,
    addPaymentMethod, deletePaymentMethod, setDefaultPaymentMethod,
    uploadTalentPortfolioImage, deleteTalentPortfolioImage,
} from '@/lib/api';
import { TalentProfile, Event, Application, Attendance, Review, PaymentMethod } from '@/types';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import ProfileOptionPicker from '@/components/ui/ProfileOptionPicker';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { EVENT_CATEGORIES, CITIES, LANGUAGES, formatEventDates } from '@/lib/utils';
import { Save, Plus, X, CalendarDays, Clock, MapPin, Camera } from 'lucide-react';
import { announceProfileUpdated } from '@/lib/profile-completion';
import { formatEgyptianMobile, isEgyptianMobile, internationalMobile } from '@/lib/phone';

export default function TalentProfilePage() {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const isArabic = language === 'ar' || language === 'ar-eg';
    const [profile, setProfile] = useState<TalentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState('');
    const [history, setHistory] = useState<{ event: Event; application: Application; attendance: Attendance | null; review: Review | null }[]>([]);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pageRef = useRef<HTMLDivElement>(null);
    const portfolioInputRef = useRef<HTMLInputElement>(null);
    const [portfolioBusy, setPortfolioBusy] = useState(false);

    // Form state
    const [fullName, setFullName] = useState('');
    const [city, setCity] = useState('');
    const [workCities, setWorkCities] = useState<string[]>([]);
    const [experienceYears, setExperienceYears] = useState('');
    const [education, setEducation] = useState('');
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [hasNoWhatsapp, setHasNoWhatsapp] = useState(false);
    const [whatsappNumber, setWhatsappNumber] = useState('');

    const [newProvider, setNewProvider] = useState('Vodafone Cash');
    const [newNumber, setNewNumber] = useState('');
    const [newAccountHolder, setNewAccountHolder] = useState('');
    const [newBankCode, setNewBankCode] = useState('');
    const [addingPayment, setAddingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const paymentPhonePlaceholder: Record<string, string> = {
        'Vodafone Cash': '010 1234 5678',
        'Orange Cash': '012 1234 5678',
        'Etisalat Cash': '011 1234 5678',
    };
    const paymentPhoneLabel = isArabic
        ? `رقم الموبايل المسجل في ${newProvider}`
        : `${newProvider} phone number`;
    const isBankPayment = newProvider === 'Bank Account';
    const isCashPayment = newProvider === 'Cash - don\'t have account';


    const addPortfolioImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !profile) return;
        setPortfolioBusy(true);
        try {
            const portfolioImages = await uploadTalentPortfolioImage(file);
            setProfile({ ...profile, portfolioImages });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not upload portfolio image');
        } finally {
            setPortfolioBusy(false);
            event.target.value = '';
        }
    };

    const removePortfolioImage = async (index: number) => {
        if (!profile) return;
        setPortfolioBusy(true);
        try {
            const portfolioImages = await deleteTalentPortfolioImage(index);
            setProfile({ ...profile, portfolioImages });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not remove portfolio image');
        } finally {
            setPortfolioBusy(false);
        }
    };

    const clearFieldError = (field: string) => {
        setFieldErrors((current) => {
            if (!current[field]) return current;
            const next = { ...current };
            delete next[field];
            return next;
        });
    };

    useEffect(() => {
        if (!user) return;
        getTalentProfileByUserId(user._id).then((p) => {
            if (p) {
                setProfile(p);
                setFullName(p.fullName);
                setCity(p.city);
                setWorkCities(p.workCities || []);
                setExperienceYears(p.experienceYears.toString());
                setEducation(p.education || '');
                setSelectedLanguages(p.languages);
                setSelectedCategories(p.categories);
                setPaymentMethods(p.paymentMethods || []);
                setPhoneNumber(formatEgyptianMobile(p.phoneNumber || ''));
                setWhatsappNumber(formatEgyptianMobile(p.whatsappNumber || ''));
                setHasNoWhatsapp(!!p.whatsappNumber && p.whatsappNumber !== p.phoneNumber);
                setHistoryLoading(true);
                getTalentEventHistory(p._id).then(setHistory).catch((err) => setHistoryError(err instanceof Error ? err.message : 'Could not load event history.')).finally(() => setHistoryLoading(false));
            }
        }).catch((err) => toast.error(err instanceof Error ? err.message : 'Could not load profile.'))
            .finally(() => setLoading(false));
    }, [user]);

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!isBankPayment && !isCashPayment && !isEgyptianMobile(newNumber)) {
            setPaymentError(isArabic ? 'اكتب رقم موبايل مصري صحيح من ١١ رقم.' : 'Enter a valid 11-digit Egyptian mobile number.');
            return;
        }
        if (isBankPayment && (newNumber.replace(/\s/g, '').length < 8 || !newAccountHolder.trim() || !newBankCode.trim())) {
            setPaymentError(isArabic ? 'اكتب اسم صاحب الحساب، كود البنك، ورقم الحساب أو الكارت.' : 'Enter the account holder, Paymob bank code, and account/card number.');
            return;
        }
        setPaymentError('');
        setAddingPayment(true);
        try {
            const issuerByProvider: Record<string, string> = {
                'Vodafone Cash': 'vodafone',
                'Orange Cash': 'orange',
                'Etisalat Cash': 'etisalat',
            };
            const updated = await addPaymentMethod(user._id, isCashPayment ? {
                provider: newProvider,
                type: 'cash',
            } : isBankPayment ? {
                provider: newProvider,
                numberOrDetail: newNumber.replace(/\s/g, ''),
                type: 'bank',
                accountHolderName: newAccountHolder.trim(),
                bankCode: newBankCode.trim(),
                accountNumber: newNumber.replace(/\s/g, ''),
            } : {
                provider: newProvider,
                numberOrDetail: internationalMobile(newNumber),
                type: 'wallet',
                issuer: issuerByProvider[newProvider],
                mobileNumber: internationalMobile(newNumber),
            });
            setPaymentMethods(updated);
            clearFieldError('paymentMethods');
            announceProfileUpdated();
            setNewNumber('');
            setNewAccountHolder('');
            setNewBankCode('');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to add payment method');
        } finally {
            setAddingPayment(false);
        }
    };

    const handleDeletePayment = async (methodId: string) => {
        if (!user) return;
        try {
            const updated = await deletePaymentMethod(user._id, methodId);
            setPaymentMethods(updated);
            announceProfileUpdated();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete payment method');
        }
    };

    const handleSetDefaultPayment = async (methodId: string) => {
        if (!user) return;
        try {
            const updated = await setDefaultPaymentMethod(user._id, methodId);
            setPaymentMethods(updated);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to set default payment method');
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSuccess(false);
        const errors: Record<string, string> = {};
        const required = isArabic ? 'هذا الحقل مطلوب.' : 'This field is required.';
        if (!(photoPreview || profile?.photo?.trim())) errors.photo = isArabic ? 'يرجى إضافة صورة شخصية.' : 'Please upload a profile picture.';
        if (!fullName.trim()) errors.fullName = required;
        else if (fullName.trim().length < 2 || fullName.trim().length > 100) errors.fullName = isArabic ? 'الاسم يجب أن يكون بين حرفين و١٠٠ حرف.' : 'Name must be 2 to 100 characters.';
        if (!city) errors.city = required;
        if (!education.trim()) errors.education = required;
        if (experienceYears && (!Number.isInteger(Number(experienceYears)) || Number(experienceYears) < 0 || Number(experienceYears) > 80)) {
            errors.experienceYears = isArabic ? 'سنوات الخبرة يجب أن تكون بين ٠ و٨٠.' : 'Experience must be a whole number from 0 to 80.';
        }
        if (!phoneNumber.trim()) errors.phoneNumber = required;
        else if (!isEgyptianMobile(phoneNumber)) errors.phoneNumber = isArabic ? 'أدخل رقم موبايل مصري صحيح.' : 'Enter a valid Egyptian mobile number.';
        if (hasNoWhatsapp && !isEgyptianMobile(whatsappNumber)) errors.whatsappNumber = isArabic ? 'أدخل رقم واتساب مصري صحيح.' : 'Enter a valid Egyptian WhatsApp number.';
        if (workCities.length === 0) errors.workCities = required;
        if (selectedLanguages.length === 0) errors.languages = required;
        if (selectedCategories.length === 0) errors.categories = required;
        if (paymentMethods.length === 0) errors.paymentMethods = isArabic ? 'يرجى إضافة طريقة دفع.' : 'Please add a payment method.';
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            window.requestAnimationFrame(() => {
                pageRef.current?.querySelector('[data-profile-error], [aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            return;
        }
        setSaving(true);
        setSuccess(false);
        try {
            const updateData: Partial<TalentProfile> = {
                fullName,
                city,
                workCities,
                experienceYears: Number(experienceYears),
                education,
                languages: selectedLanguages,
                categories: selectedCategories,
                phoneNumber: internationalMobile(phoneNumber),
                whatsappNumber: internationalMobile(hasNoWhatsapp ? whatsappNumber : phoneNumber),
            };
            if (photoPreview) updateData.photo = photoPreview;
            const updated = await updateTalentProfile(user._id, updateData);
            setProfile(updated);
            announceProfileUpdated();
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not save profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleAllCities = () => {
        if (workCities.includes('all')) {
            setWorkCities([]);
        } else {
            setWorkCities(['all']);
        }
    };

    const toggleCity = (cityVal: string) => {
        if (workCities.includes('all')) return;
        if (workCities.includes(cityVal)) {
            setWorkCities(workCities.filter(c => c !== cityVal));
        } else {
            setWorkCities([...workCities, cityVal]);
        }
    };

    const toggleItem = (item: string, list: string[], setter: (v: string[]) => void) => {
        setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreview(reader.result as string);
            clearFieldError('photo');
        };
        reader.readAsDataURL(file);
    };

    if (loading) {
        return <ContentSkeleton variant="profile" />;
    }

    return (
        <div ref={pageRef} className="max-w-3xl mx-auto space-y-6 animate-fade-in text-start">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="display text-3xl sm:text-4xl">{t('my_profile_title')}</h1>
                    <p className="text-dark-400 mt-1 font-semibold">{t('my_profile_desc')}</p>
                </div>
                {success && (
                    <Badge variant="success">{t('save_success')}</Badge>
                )}
            </div>

            {/* Avatar Section */}
            <Card className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    accept="image/*"
                    className="hidden"
                />
                <div className="shrink-0 text-center">
                    <div className="relative group">
                        <Avatar src={photoPreview || profile?.photo} name={fullName || 'Talent'} size="xl" />
                        <button
                            type="button"
                            aria-label={isArabic ? 'إضافة صورة شخصية' : 'Upload profile picture'}
                            aria-describedby={fieldErrors.photo ? 'profile-photo-error' : undefined}
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 rounded-full bg-dark-50/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        >
                            <Camera size={20} className="text-white" />
                        </button>
                    </div>
                    {fieldErrors.photo && <p id="profile-photo-error" role="alert" data-profile-error className="mt-2 text-xs text-danger-500">{fieldErrors.photo}</p>}
                </div>
                <div className="text-center sm:text-start flex-1">
                    <h3 className="text-lg font-black text-dark-50">{fullName || 'Your Name'}</h3>
                    <p className="text-sm text-dark-400 font-semibold">{city || 'Your City'}</p>
                    <div className="flex justify-center sm:justify-start items-center gap-3 mt-2 flex-wrap">
                        <Badge variant="primary">{profile?.reliabilityScore ?? 0}% {isArabic ? 'موثوقية' : 'Reliable'}</Badge>
                        <Badge variant="warning">{profile?.ratingAverage ?? 0} ★ {isArabic ? 'تقييم' : 'Rating'}</Badge>
                        {profile && isVerifiedTalent(profile) && <Badge variant="success">✓ {t('verified_label')}</Badge>}
                        {profile && profile.lateExcuseCount >= 5 && (
                            <Badge variant="danger">⚠️ {profile.lateExcuseCount} {isArabic ? 'اعتذار متأخر' : 'Late Excuses'}</Badge>
                        )}
                    </div>
                    {profile && profile.lateExcuseCount >= 5 && (
                        <p className="text-xs text-danger-500 mt-2 font-bold leading-relaxed">
                            {isArabic 
                                ? `لديك ${profile.lateExcuseCount} اعتذارات متأخرة. يرجى حضور 5 فعاليات متتالية لتصفية هذا التحذير (${profile.consecutiveGoodEvents}/5 من التقدم).`
                                : `You have ${profile.lateExcuseCount} late excuses. Attend 5 events in a row to clear this warning (${profile.consecutiveGoodEvents}/5 progress).`}
                        </p>
                    )}
                </div>
            </Card>

            {/* Basic Info */}
            <Card>
                <h3 className="text-xs font-black text-dark-300 mb-4">{t('basic_info')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label={t('full_name_label')} value={fullName} error={fieldErrors.fullName} onChange={(e) => { setFullName(e.target.value); clearFieldError('fullName'); }} placeholder={t('full_name_label')} />
                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-dark-300">{t('city_label')}</label>
                        <select
                            value={city}
                            onChange={(e) => { setCity(e.target.value); clearFieldError('city'); }}
                            className={`w-full bg-dark-950 border-2 rounded-xl px-4 py-2.5 text-sm text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all appearance-none cursor-pointer ${fieldErrors.city ? 'border-danger-500' : 'border-dark-50'}`}
                        >
                            <option value="" className="bg-dark-900 text-dark-100">{t('select_city')}</option>
                            {CITIES.map((c) => <option key={c} value={c} className="bg-dark-900 text-dark-100">{c}</option>)}
                        </select>
                        {fieldErrors.city && <p role="alert" data-profile-error className="text-xs text-danger-500">{fieldErrors.city}</p>}
                    </div>
                    <Input label={t('exp_years_label')} type="number" min={0} max={80} step={1} value={experienceYears} error={fieldErrors.experienceYears} onChange={(e) => { setExperienceYears(e.target.value); clearFieldError('experienceYears'); }} placeholder="3" />
                    <Input label={t('education_label')} value={education} error={fieldErrors.education} onChange={(e) => { setEducation(e.target.value); clearFieldError('education'); }} placeholder={isArabic ? 'الجامعة أو المدرسة' : 'University or school'} required />
                    
                    <div className="space-y-4 md:col-span-2 border-t border-dark-900 pt-4 mt-2">
                        <h4 className="text-xs font-black text-dark-300 ">{t('contact_info')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t('phone_label')}
                                placeholder="010 1234 5678"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel-national"
                                dir="ltr"
                                value={phoneNumber}
                                error={fieldErrors.phoneNumber}
                                onChange={(e) => { setPhoneNumber(formatEgyptianMobile(e.target.value)); clearFieldError('phoneNumber'); }}
                                required
                            />

                            <div className="md:col-span-2 space-y-2">
                                <label className="inline-flex min-h-9 items-center gap-2 cursor-pointer select-none text-xs font-medium text-dark-200">
                                    <input
                                        type="checkbox"
                                        aria-controls="different-whatsapp-field"
                                        checked={hasNoWhatsapp}
                                        onChange={(e) => {
                                            setHasNoWhatsapp(e.target.checked);
                                            if (!e.target.checked) setWhatsappNumber('');
                                        }}
                                        className="h-4 w-4 shrink-0 rounded accent-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success-500"
                                    />
                                    {isArabic ? 'رقم واتساب مختلف' : 'Different WhatsApp number'}
                                </label>
                                <div id="different-whatsapp-field" hidden={!hasNoWhatsapp} className="max-w-sm">
                                    {hasNoWhatsapp && (
                                        <Input
                                            aria-label={t('whatsapp_label')}
                                            placeholder="012 1234 5678"
                                            type="tel"
                                            inputMode="tel"
                                            autoComplete="tel-national"
                                            dir="ltr"
                                            value={whatsappNumber}
                                            error={fieldErrors.whatsappNumber}
                                            onChange={(e) => { setWhatsappNumber(formatEgyptianMobile(e.target.value)); clearFieldError('whatsappNumber'); }}
                                            required
                                        />
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </Card>

            {/* Payment Methods */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black text-dark-300 ">{t('payment_accounts')}</h3>
                    <Badge variant="primary">{isArabic ? 'مطلوب لإكمال الملف' : 'Required for completion'}</Badge>
                </div>
                <p className="text-xs text-dark-400 mb-4 font-semibold leading-relaxed">
                    {t('payment_desc')}
                </p>
                {fieldErrors.paymentMethods && <p role="alert" data-profile-error className="mb-4 text-xs text-danger-500">{fieldErrors.paymentMethods}</p>}

                {/* List of existing payment methods */}
                {paymentMethods.length === 0 ? (
                    <p className="text-sm text-dark-500 italic mb-4 font-semibold">{t('no_payment')}</p>
                ) : (
                    <div className="space-y-2 mb-4">
                        {paymentMethods.map((m) => (
                            <div key={m._id} className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-dark-950">
                                <div>
                                    <span className="text-xs font-black text-primary-555 bg-primary-50 border-2 border-dark-50 px-2 py-0.5 rounded mr-2 ml-2">
                                        {m.provider}
                                    </span>
                                    {m.numberOrDetail && <span className="text-sm font-extrabold text-dark-100">{m.numberOrDetail}</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    {m.isDefault ? (
                                        <Badge variant="success">{t('default_tag')}</Badge>
                                    ) : (
                                        <button
                                            onClick={() => handleSetDefaultPayment(m._id)}
                                            className="text-xs font-bold text-dark-200 hover:text-dark-50 border-2 border-dark-50 rounded px-2 py-1 transition-colors cursor-pointer bg-dark-950"
                                        >
                                            {t('set_default')}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeletePayment(m._id)}
                                        className="text-xs text-danger-500 hover:bg-danger-500/10 p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center border-2 border-transparent hover:border-danger-500"
                                        title="Delete payment account"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Payment Form */}
                <form onSubmit={handleAddPayment} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end border-t border-dark-900 pt-4">
                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-dark-300">{t('account_type')}</label>
                        <select
                            value={newProvider}
                            onChange={(e) => {
                                setNewProvider(e.target.value);
                                setNewNumber('');
                                setNewAccountHolder('');
                                setNewBankCode('');
                                setPaymentError('');
                            }}
                            className="w-full bg-dark-950 border-2 border-dark-50 rounded-xl px-4 py-2.5 text-sm text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all appearance-none cursor-pointer"
                        >
                            <option value="Vodafone Cash" className="bg-dark-900 text-dark-100">Vodafone Cash</option>
                            <option value="Orange Cash" className="bg-dark-900 text-dark-100">Orange Cash</option>
                            <option value="Etisalat Cash" className="bg-dark-900 text-dark-100">Etisalat Cash</option>
                            <option value="Bank Account" className="bg-dark-900 text-dark-100">{isArabic ? 'حساب بنكي' : 'Bank Account'}</option>
                            <option value="Cash - don't have account" className="bg-dark-900 text-dark-100">{isArabic ? 'كاش - ليس لدي حساب' : "Cash - don't have account"}</option>
                        </select>
                    </div>
                    {isBankPayment && (
                        <Input
                            label={isArabic ? 'اسم صاحب الحساب' : 'Account holder name'}
                            placeholder={isArabic ? 'الاسم زي ما هو مسجل في البنك' : 'Name registered with the bank'}
                            value={newAccountHolder}
                            onChange={(e) => { setNewAccountHolder(e.target.value); setPaymentError(''); }}
                            required
                        />
                    )}
                    {isBankPayment && (
                        <Input
                            label={isArabic ? 'كود البنك في Paymob' : 'Paymob bank code'}
                            placeholder="e.g. CIB"
                            dir="ltr"
                            value={newBankCode}
                            onChange={(e) => { setNewBankCode(e.target.value); setPaymentError(''); }}
                            required
                        />
                    )}
                    {!isCashPayment && <Input
                        label={isBankPayment ? (isArabic ? 'رقم الحساب أو الكارت' : 'Account or card number') : paymentPhoneLabel}
                        placeholder={isBankPayment ? '0000 0000 0000 0000' : paymentPhonePlaceholder[newProvider]}
                        type={isBankPayment ? 'text' : 'tel'}
                        inputMode={isBankPayment ? 'numeric' : 'tel'}
                        dir="ltr"
                        value={newNumber}
                        error={paymentError}
                        onChange={(e) => {
                            setNewNumber(isBankPayment ? e.target.value.replace(/[^0-9 ]/g, '') : formatEgyptianMobile(e.target.value));
                            setPaymentError('');
                        }}
                        required
                    />}
                    <Button type="submit" isLoading={addingPayment} variant="primary" className="font-black py-2.5 md:col-span-2">
                        {t('add_account_btn')}
                    </Button>
                </form>
            </Card>

            <Card>
                <div className="space-y-6">
                    <ProfileOptionPicker
                        title={t('languages_title')}
                        options={LANGUAGES}
                        selected={selectedLanguages}
                        onToggle={(lang) => { toggleItem(lang, selectedLanguages, setSelectedLanguages); clearFieldError('languages'); }}
                        isArabic={isArabic}
                        error={fieldErrors.languages}
                    />
                    <div>
                        <ProfileOptionPicker
                            title={t('working_cities')}
                            options={CITIES}
                            selected={workCities}
                            onToggle={(cityVal) => { toggleCity(cityVal); clearFieldError('workCities'); }}
                            isArabic={isArabic}
                            error={fieldErrors.workCities}
                            allOption={{ label: t('all_cities'), checked: workCities.includes('all'), onToggle: () => { handleToggleAllCities(); clearFieldError('workCities'); } }}
                        />
                    </div>
                    <div>
                        <ProfileOptionPicker
                            title={t('work_categories')}
                            options={EVENT_CATEGORIES}
                            selected={selectedCategories}
                            onToggle={(cat) => { toggleItem(cat, selectedCategories, setSelectedCategories); clearFieldError('categories'); }}
                            isArabic={isArabic}
                            error={fieldErrors.categories}
                        />
                    </div>
                </div>
            </Card>

            {/* Portfolio Images */}
            <Card>
                <h3 className="text-xs font-black text-dark-300 mb-4">{t('portfolio_title')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {profile?.portfolioImages.map((img, i) => (
                        <div key={i} className="relative group rounded-xl overflow-hidden aspect-video border-2 border-dark-50">
                            <img src={img} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-dark-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button type="button" disabled={portfolioBusy} onClick={() => removePortfolioImage(i)} aria-label={`Remove portfolio image ${i + 1}`} className="p-1.5 rounded-lg bg-danger-500 text-white cursor-pointer border border-dark-50 shadow disabled:opacity-50">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                    <input ref={portfolioInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={addPortfolioImage} />
                    <button type="button" disabled={portfolioBusy || (profile?.portfolioImages.length || 0) >= 12} onClick={() => portfolioInputRef.current?.click()} className="rounded-xl border border-dashed border-dark-50 hover:border-primary-500/50 aspect-video flex flex-col items-center justify-center text-dark-400 hover:text-primary-500 transition-all cursor-pointer bg-dark-950 disabled:opacity-50">
                        {portfolioBusy ? <SkeletonGroup className="w-2/3"><Skeleton className="mx-auto h-6 w-6" /><Skeleton className="mt-2 h-3 w-full" /></SkeletonGroup> : <><Plus size={20} /><span className="text-xs mt-1 font-bold">{t('add_photo')}</span></>}
                    </button>
                </div>
            </Card>

            {/* Event History */}
            <Card>
                <h3 className="text-xs font-black text-dark-300 mb-4">
                    {t('event_history_title')} ({history.length})
                </h3>
                {historyLoading ? <ContentSkeleton variant="list" count={2} /> : historyError ? <p role="alert" className="text-sm text-danger-500">{historyError}</p> : history.length === 0 ? (
                    <p className="text-sm text-dark-500 text-center py-6 font-semibold">{t('no_history')}</p>
                ) : (
                    <div className="space-y-3">
                        {history.map((item) => (
                            <div key={item.application._id} className="flex items-start gap-4 p-4 rounded-xl border-2 border-dark-50 hover:bg-dark-900 transition-colors bg-dark-950">
                                <div className="p-2 rounded-lg bg-primary-50 text-primary-500 mt-0.5 border border-dark-50">
                                    <CalendarDays size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-dark-100 truncate">{item.event.title}</p>
                                    <div className="flex items-center gap-3 text-xs text-dark-400 mt-1 font-semibold">
                                        <span className="flex items-center gap-1"><Clock size={10} /> {formatEventDates(item.event)}</span>
                                        <span className="flex items-center gap-1"><MapPin size={10} /> {item.event.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        {item.attendance ? (
                                            item.attendance.status === 'present' ? (
                                                <Badge variant="success">{t('attended_tag')}</Badge>
                                            ) : (
                                                <Badge variant="danger">{t('no_show_tag')}</Badge>
                                            )
                                        ) : (
                                            <Badge variant="default">{t('hired_tag')}</Badge>
                                        )}
                                        {item.review && (
                                            <Badge variant="warning">{item.review.rating} ★</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} isLoading={saving} icon={<Save size={16} />} size="lg" className="font-black">
                    {t('save_changes')}
                </Button>
            </div>
        </div>
    );
}
