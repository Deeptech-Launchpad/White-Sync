/**
 * New post — the same two gestures as the WhatsApp group: a photo and one line.
 * "Gayathri, kindly send the pro-forma" -- SmartOps reads who it is for and what is asked,
 * and shows it back on the job; nothing needs choosing here.
 */

import React, { useState } from 'react';
import {
    ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput,
    TouchableOpacity, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { pickAttachment } from '@/components/team/Attach';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useResponsive } from '@/hooks/useResponsive';
import { PickedFile, team } from '@/services/smartops';

export default function NewPostScreen() {
    const router = useRouter();
    // A file handed over by the Android share sheet (see app/team/share handling), if any.
    const params = useLocalSearchParams<{ sharedUri?: string; sharedName?: string; sharedType?: string; sharedText?: string }>();
    const theme = useColorScheme() ?? 'light';
    const colors = Colors[theme];
    const { vs } = useResponsive();

    const [text, setText] = useState(params.sharedText ?? '');
    const [file, setFile] = useState<PickedFile | null>(
        params.sharedUri ? { uri: params.sharedUri, name: params.sharedName, mimeType: params.sharedType } : null);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isImage = !!file && !(file.mimeType || '').includes('pdf') && !(file.name || '').toLowerCase().endsWith('.pdf');

    const send = async () => {
        if (!text.trim() && !file) {
            setError('Write something or attach a photo.');
            return;
        }
        setSending(true);
        setError(null);
        const r = await team.post(text.trim(), file);
        setSending(false);
        if (!r.ok) {
            setError(r.error);
            return;
        }
        router.replace({ pathname: '/team/[id]', params: { id: r.data.job.id } });
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.header, { paddingTop: vs(56), backgroundColor: colors.surface }]}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.circle, { backgroundColor: colors.surfaceSecondary }]}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>New post</Text>
                <TouchableOpacity
                    disabled={sending}
                    onPress={send}
                    style={[styles.send, { backgroundColor: colors.primary, opacity: sending ? 0.6 : 1 }]}
                >
                    {sending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.sendText}>Post</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
                <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                    placeholder={'Gayathri, kindly send the pro-forma to …\nSanthiya, place the order to Habasit\nNarayanan sir, send the material thru …'}
                    placeholderTextColor={colors.placeholder}
                    value={text}
                    onChangeText={setText}
                    multiline
                    autoFocus={!params.sharedUri}
                />
                <Text style={[styles.hint, { color: colors.textSecondary }]}>
                    {"Start with the person's name. SmartOps reads who it is for and what is asked — you can correct it on the job."}
                </Text>

                {file ? (
                    <View style={[styles.attachment, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        {isImage ? (
                            <Image source={{ uri: file.uri }} style={styles.preview} resizeMode="cover" />
                        ) : (
                            <View style={[styles.preview, styles.pdf, { backgroundColor: colors.surfaceSecondary }]}>
                                <Ionicons name="document-text" size={36} color={colors.danger} />
                            </View>
                        )}
                        <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={2}>{file.name || 'Photo'}</Text>
                        <TouchableOpacity onPress={() => setFile(null)}>
                            <Ionicons name="trash-outline" size={22} color={colors.danger} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={() => pickAttachment(setFile)}
                        style={[styles.attach, { borderColor: colors.primary }]}
                    >
                        <Ionicons name="camera-outline" size={24} color={colors.primary} />
                        <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 15 }}>Add photo or PDF (customer PO, payment…)</Text>
                    </TouchableOpacity>
                )}

                {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14 },
    circle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 20, fontWeight: '900' },
    send: { paddingHorizontal: 22, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', minWidth: 80 },
    sendText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
    input: { minHeight: 140, borderRadius: 18, borderWidth: 1, padding: 16, fontSize: 16, textAlignVertical: 'top' },
    hint: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
    attach: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 18, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
    attachment: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 1, padding: 10 },
    preview: { width: 72, height: 72, borderRadius: 12 },
    pdf: { justifyContent: 'center', alignItems: 'center' },
    fileName: { flex: 1, fontSize: 14, fontWeight: '600' },
    error: { fontSize: 14, fontWeight: '700' },
});
