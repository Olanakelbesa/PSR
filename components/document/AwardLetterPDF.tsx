// components/document/AwardLetterPDF.tsx
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image as PdfImage,
} from "@react-pdf/renderer";
export interface AwardData {
  organization_name: string;
  organization_amharic?: string;
  document_no?: string;
  issue_no?: string;
  refNo: string;
  date: string;
  recipients: string[]; // list of names
  projectTitle: string;
  approvalStart: string;
  approvalEnd: string;
  totalAmount: string;
  percentageAmount: string;
  percentageAmountWords?: string;
  percentage: string;
  agreementDeadline: string;
  logoPath?: string;
  vicePresidentName?: string; // optional - for signature
  submitting_office_name_en?: string;
  second_level_office_name_en?: string;
}

// Reuse your existing styles + add award-specific ones
const styles = StyleSheet.create({
  page: {
    padding: "20mm",
    fontSize: 11,
    fontFamily: "Times-Roman",
    lineHeight: 1.5,
  },

  contentWrapper: {
    width: "100%",
    maxWidth: "100%",
  },

  paragraph: {
    width: "100%",
    textAlign: "justify",
    hyphens: "auto",
    marginBottom: 10,
  },

  // ── Reuse your header styles ──
  headerTable: {
    border: "1pt solid #000000",
    marginBottom: 24,
    fontSize: 11,
  },
  headerRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #000000",
    height: 60,
  },
  headerBox: {
    borderRight: "1pt solid #000000",
    justifyContent: "center",
    alignItems: "center",
  },
  logoBox: { width: "20%" },
  logoInner: { width: 40, height: 40, objectFit: "contain" as const },
  orgBox: {
    width: "60%",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  orgLabel: { fontSize: 9 },
  orgAmharic: { fontSize: 9, fontWeight: "bold" },
  orgName: { fontSize: 11, fontWeight: "bold", marginTop: 2 },
  docNoBox: {
    width: "20%",
    padding: 6,
    fontSize: 9,
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  docNoLabel: { marginBottom: 6, fontSize: 9 },
  docNoValue: { fontSize: 9 },

  headerRow2: { flexDirection: "row", height: 36 },
  titleSection: {
    width: "75%",
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    borderRight: "1pt solid #000000",
    position: "relative",
  },
  titleLabel: { position: "absolute", top: 4, left: 6, fontSize: 7 },
  titleText: { fontSize: 11, fontWeight: "bold", textAlign: "center" },
  issueBox: {
    width: "12.5%",
    borderRight: "1pt solid #000000",
    justifyContent: "center",
    alignItems: "center",
  },
  issueLabel: { fontSize: 7 },
  issueValue: { fontSize: 10 },
  pageNoBox: {
    width: "12.5%",
    justifyContent: "center",
    alignItems: "center",
  },
  pageNoLabel: { fontSize: 7 },
  pageNoValue: { fontSize: 9 },

  bold: { fontWeight: "bold" },
  subject: {
    fontSize: 12,
    fontWeight: "bold",
    marginVertical: 16,
    textAlign: "center",
  },
  textToEnd: { textAlign: "right" },
  textRow: { flexDirection: "row", gap: 1 },
  toSection: { marginTop: 16, marginBottom: 12 },
  recipientsList: { marginLeft: 20, marginBottom: 8 },
  closing: { marginTop: 40, marginBottom: 60 },
  signatureLine: {
    borderBottom: "1pt solid black",
    width: 180,
    marginTop: 32,
    marginBottom: 4,
  },
  ccSection: { marginTop: 32, fontSize: 10 },
  ccLabel: { fontWeight: "bold", marginBottom: 6 },
});

// Your existing PageHeader (slightly adjusted for award context)
const PageHeader = ({
  page,
  total,
  data,
}: {
  page: number;
  total: number;
  data: AwardData;
}) => (
  <View style={styles.headerTable}>
    <View style={styles.headerRow}>
      <View style={[styles.headerBox, styles.logoBox]}>
        <PdfImage
          src={data.logoPath || "/placeholder-logo.svg"}
          style={styles.logoInner}
        />
      </View>
      <View style={[styles.headerBox, styles.orgBox]}>
        <Text style={styles.orgLabel}>Organization Name:</Text>
        <Text style={[styles.bold, styles.orgName]}>
          {data.organization_name ||
            "ADDIS ABABA SCIENCE AND TECHNOLOGY UNIVERSITY"}
        </Text>
      </View>
      <View style={styles.docNoBox}>
        <Text style={styles.docNoLabel}>Document No.</Text>
        <Text style={styles.docNoValue}>
          {data.document_no || "VP/RCS/___/___"}
        </Text>
      </View>
    </View>

    <View style={styles.headerRow2}>
      <View style={styles.titleSection}>
        <Text style={styles.titleLabel}>Title:</Text>
        <Text style={[styles.bold, styles.titleText]}>
          {data.second_level_office_name_en} GRANT AWARD LETTER
        </Text>
      </View>
      <View style={styles.issueBox}>
        <Text style={styles.issueLabel}>Ref. No.</Text>
        <Text style={styles.pageNoValue}>{data.refNo}</Text>
      </View>
      <View style={styles.pageNoBox}>
        <Text style={styles.pageNoLabel}>Page No.:</Text>
        <Text style={styles.pageNoValue}>
          Page {page} of {total}
        </Text>
      </View>
    </View>
  </View>
);

const AwardLetterPDF: React.FC<{ data: AwardData }> = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PageHeader page={1} total={1} data={data} />
        <View style={styles.contentWrapper}>
          <View
            style={{
              marginTop: 6,
              flexDirection: "column",
              alignItems: "flex-end",
              width: "100%",
              fontSize: 10,
            }}
          >
            <Text>Ref: {data.refNo}</Text>
            <Text>Date: {data.date}</Text>
          </View>

          <View style={[styles.toSection, styles.textRow]}>
            <Text style={{ fontWeight: "bold" }}>To:</Text>
            <View style={styles.recipientsList}>
              {data.recipients.map((name, idx) => (
                <Text key={idx}>{name}</Text>
              ))}
            </View>
          </View>

          <Text style={styles.subject}>
            Subject: Decision To Award {data.second_level_office_name_en} Grant
          </Text>

          <Text style={styles.paragraph}>
            <Text>
              It is to be reminded that in response to the call for proposals by
              our university, you have submitted a proposal entitled{" "}
            </Text>
            <Text style={styles.bold}>
              {'“'}{data.projectTitle}{'”'}
            </Text>
            <Text>
              {" "}developed by you and other team members. The proposal has been
              subjected to rigorous evaluation by a panel of assessors and
              recommended for funding.
            </Text>
          </Text>

          <Text style={styles.paragraph}>
            <Text>
              Thus, I am pleased to inform you that the Office of the Vice
              President for Research and Technology Transfer has provisionally
              approved the same for the period of{" "}
            </Text>
            <Text style={styles.bold}>{data.approvalStart}</Text>
            <Text> to </Text>
            <Text style={styles.bold}>{data.approvalEnd}</Text>
            <Text>
              . The total project grant award for the period is{" "}
            </Text>
            <Text style={styles.bold}>Birr {data.totalAmount} ETB</Text>
            <Text> (the {data.percentage}% is </Text>
            <Text style={styles.bold}>Birr {data.percentageAmountWords} ETB</Text>
            <Text>).</Text>
          </Text>

          <Text style={styles.paragraph}>
            <Text>
              This is also to request you to sign the project grant award
              contractual agreement until{" "}
            </Text>
            <Text style={styles.bold}>{data.agreementDeadline}</Text>
            <Text>
              . We wish you success in your project and look forward to
              receiving outputs of the project.
            </Text>
          </Text>

          <View style={styles.closing}>
            <Text style={styles.textToEnd}>With Regards,</Text>
          </View>

          <View>
            <Text style={styles.ccLabel}>Cc:</Text>
            <Text>Office of the President</Text>
            <Text>Office of Vice President for Academic Affairs</Text>
            {data.second_level_office_name_en ? (
              <Text>Office of {data.second_level_office_name_en}</Text>
            ) : null}
            {data.submitting_office_name_en ? (
              <Text>{data.submitting_office_name_en}</Text>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default AwardLetterPDF;
