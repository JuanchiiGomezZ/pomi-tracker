import { StyleSheet } from "react-native-unistyles";
import { ScreenWrapper } from "@/shared/components/ui";
import { Text } from "@/shared/components/ui";
import { useTranslation } from "react-i18next";

export default function PrivacyScreen() {
  const { t } = useTranslation("auth");

  return (
    <ScreenWrapper scroll edges={["top", "bottom"]}>
      <Text variant="h2" style={styles.title}>
        {t("login.privacy_policy")}
      </Text>

      <Text variant="body" color="secondary" style={styles.lastUpdated}>
        Last updated: January 2026
      </Text>

      <Text variant="body" style={styles.section}>
        Your privacy is important to us. This Privacy Policy explains how DailyLoop collects, uses, and protects your information.
      </Text>

      <Text variant="body" style={styles.section}>
        <Text style={styles.bold}>1. Information We Collect</Text>
        {"\n\n"}
        <Text>• Account Information: When you sign in with Google or Apple, we receive your name and email address.</Text>
        {"\n"}
        <Text>• Usage Data: We collect information about how you use the app, including your habit tracking data.</Text>
        {"\n"}
        <Text>• Device Information: We may collect device type, OS version, and app version for troubleshooting.</Text>
      </Text>

      <Text variant="body" style={styles.section}>
        <Text style={styles.bold}>2. How We Use Your Information</Text>
        {"\n\n"}
        <Text>• To provide and improve the DailyLoop service</Text>
        {"\n"}
        <Text>• To authenticate your account</Text>
        {"\n"}
        <Text>• To analyze app performance and user experience</Text>
        {"\n"}
        <Text>• To communicate important updates about the app</Text>
      </Text>

      <Text variant="body" style={styles.section}>
        <Text style={styles.bold}>3. Data Storage and Security</Text>
        {"\n\n"}
        Your data is stored securely using industry-standard encryption. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
      </Text>

      <Text variant="body" style={styles.section}>
        <Text style={styles.bold}>4. Third-Party Services</Text>
        {"\n\n"}
        DailyLoop uses third-party authentication services (Google and Apple Sign-In). These services have their own privacy policies governing your data.
      </Text>

      <Text variant="body" style={styles.section}>
        <Text style={styles.bold}>5. Data Retention</Text>
        {"\n\n"}
        We retain your personal information for as long as your account is active or as needed to provide you services. You may delete your account and associated data at any time through app settings.
      </Text>

      <Text variant="body" style={styles.section}>
        <Text style={styles.bold}>6. Your Rights</Text>
        {"\n\n"}
        <Text>• Access: You can request a copy of your personal data</Text>
        {"\n"}
        <Text>• Correction: You can request correction of inaccurate data</Text>
        {"\n"}
        <Text>• Deletion: You can request deletion of your account and data</Text>
        {"\n"}
        <Text>• Portability: You can request a export of your data</Text>
      </Text>

      <Text variant="body" style={styles.section}>
        <Text style={styles.bold}>7. Children's Privacy</Text>
        {"\n\n"}
        DailyLoop is not intended for use by individuals under the age of 13. We do not knowingly collect personal information from children under 13.
      </Text>

      <Text variant="body" style={styles.section}>
        <Text style={styles.bold}>8. Changes to This Policy</Text>
        {"\n\n"}
        We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
      </Text>

      <Text variant="body" style={styles.section}>
        <Text style={styles.bold}>9. Contact Us</Text>
        {"\n\n"}
        If you have questions about this Privacy Policy, please contact us through the app settings.
      </Text>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create((theme) => ({
  title: {
    marginBottom: theme.spacing(2),
  },
  lastUpdated: {
    marginBottom: theme.spacing(6),
  },
  section: {
    marginBottom: theme.spacing(6),
    lineHeight: 22,
  },
  bold: {
    fontFamily: theme.fontFamily.semibold,
  },
}));
