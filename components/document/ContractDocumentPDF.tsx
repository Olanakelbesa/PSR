import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { ContractData } from "@/types/agriments";

// ──────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    padding: "20mm",
    fontSize: 11,
    fontFamily: "Times-Roman",
    lineHeight: 1.5,
    color: "#000000",
  },

  contentWrapper: {
    width: "100%",
    maxWidth: "100%",
  },

  paragraph: {
    width: "100%",
    textAlign: "justify",
    hyphens: "auto",
  },

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
  logoInner: { width: 40, height: 40, objectFit: "contain" },
  orgBox: {
    width: "60%",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  orgLabel: { fontSize: 9 },
  orgAmharic: { fontSize: 8, fontWeight: "bold" },
  orgName: { fontSize: 9, fontWeight: "bold", marginTop: 2 },
  docNoBox: {
    width: "20%",
    padding: 6,
    fontSize: 9,
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  docNoLabel: { marginBottom: 6, fontSize: 9 },
  docNoValue: { fontSize: 9 },
  headerRow2: { flexDirection: "row", height: 30 },
  titleSection: {
    width: "80%",
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    borderRight: "1pt solid #000000",
    position: "relative",
  },
  titleLabel: { position: "absolute", top: 2, left: 4, fontSize: 6 },
  titleText: { fontSize: 10, fontWeight: "bold" },
  issueBox: {
    width: "10%",
    borderRight: "1pt solid #000000",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  issueLabel: { fontSize: 6 },
  issueValue: { fontSize: 10 },
  pageNoBox: {
    width: "10%",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  pageNoLabel: { fontSize: 6 },
  pageNoValue: { fontSize: 9 },

  bold: { fontWeight: "bold" },
  textJustify: { textAlign: "justify" },
  textCenter: { textAlign: "center" },
  articleTitle: {
    textAlign: "center",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 24,
    fontSize: 14,
  },
  sectionTitle: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 8,
    textTransform: "uppercase",
    fontSize: 14,
  },
  listRow: {
    flexDirection: "row",
    marginBottom: 8,
    width: "100%",
  },
  bullet: {
    width: 32,
    textAlign: "right",
    marginRight: 8,
    flexShrink: 0,
  },
  indent: { paddingLeft: 40 },
  mt8: { marginTop: 32 },
  mb4: { marginBottom: 16 },
  mb2: { marginBottom: 8 },
  mb6: { marginBottom: 24 },
  italic: { fontStyle: "italic", color: "rgb(156, 163, 175)" },
  pl10: { paddingLeft: 40 },
  mt1: { marginTop: 4 },

  footer: {
    position: "absolute",
    bottom: "32pt",
    left: "48pt",
    right: "48pt",
    borderTop: "2pt solid #000000",
    paddingTop: 8,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "bold",
  },
});

// ──────────────────────────────────────────────
// Components
// ──────────────────────────────────────────────
const PageHeader = ({
  page,
  total,
  data,
}: {
  page: number;
  total: number;
  data: ContractData;
}) => (
  <View style={styles.headerTable}>
    <View style={styles.headerRow}>
      <View style={[styles.headerBox, styles.logoBox]}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image
          src={data.logoPath || "/placeholder-logo.svg"}
          style={styles.logoInner}
        />
      </View>
      <View style={[styles.headerBox, styles.orgBox]}>
        <Text style={styles.orgLabel}>Organization Name:</Text>
        <Text style={[styles.bold, styles.orgAmharic]}></Text>
        <Text style={[styles.bold, styles.orgName]}>
          {data.organization_name}
        </Text>
      </View>
      <View style={styles.docNoBox}>
        <Text style={styles.docNoLabel}>Document No.:</Text>
        <Text style={styles.docNoValue}>{data.document_no}</Text>
      </View>
    </View>
    <View style={styles.headerRow2}>
      <View style={styles.titleSection}>
        <Text style={styles.titleLabel}>Title:</Text>
        <Text style={[styles.bold, styles.titleText]}>
          INTERNAL RESEARCH FUND CONTRACT AGREEMENT FORM
        </Text>
      </View>
      <View style={styles.issueBox}>
        <Text style={styles.issueLabel}>Issue No.</Text>
        <Text style={styles.issueValue}>{data.issue_no}</Text>
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

const Footer = () => (
  <View style={styles.footer}>
    <Text>PLEASE MAKE SURE THAT THIS IS THE CORRECT ISSUE BEFORE USE</Text>
  </View>
);

// ──────────────────────────────────────────────
// Main Document Component
// ──────────────────────────────────────────────
const ContractDocumentPDF: React.FC<{ data: ContractData }> = ({ data }) => {
  return (
    <Document>
      {/* PAGE 1 */}
      <Page size="A4" style={styles.page}>
        <PageHeader page={1} total={8} data={data} />

        <View style={styles.contentWrapper}>
          <View style={styles.mt8}>
            <Text style={styles.articleTitle}>
              Internal Research Fund Contract Agreement Between
            </Text>

            <Text style={styles.paragraph}>
              Name of Principal Investigator:{" "}
              {data.principal_investigator || "________________"}
            </Text>

            <Text style={[styles.paragraph, { marginTop: 12 }]}>
              and co-Investigators list
            </Text>

            {data.co_investigators.length > 0 ? (
              <View style={[styles.pl10, styles.mt1]}>
                {data.co_investigators.map((co, idx) => (
                  <Text key={co.id || idx} style={styles.paragraph}>
                    {co.index}. {co.name}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={[styles.italic, styles.pl10, styles.paragraph]}>
                {""}
              </Text>
            )}

            <Text style={[styles.paragraph, { marginTop: 12 }]}>
              The principal investigator of the research project entitled{" "}
              <Text style={styles.bold}>
                {data.proposal_title || "____________________"}
              </Text>
              . The project period of which is{" "}
              <Text>{data.project_duration_years || "___"}</Text> years starting
              from the effective date of this agreement (Herein after referred
              to as the <Text style={styles.bold}>Principal Investigator</Text>)
            </Text>

            <Text style={[styles.paragraph, { marginTop: 12 }]}>
              With address:
            </Text>

            <Text style={styles.paragraph}>
              College of {data.college || "________"}, Department of{" "}
              {data.department || "________"},{" "}
              {data.center_of_excellence || "________"} Center of Excellence
            </Text>

            <Text style={styles.paragraph}>
              Email: {data.email || "________"}, phone No:{" "}
              {data.phone || "________"}
            </Text>

            <Text
              style={[styles.textCenter, styles.bold, styles.mt8, styles.mb4]}
            >
              And
            </Text>

            <Text style={styles.paragraph}>
              <Text style={styles.bold}>
                {data.organization_name} (Herein after referred to as AASTU),
              </Text>
            </Text>
            <Text style={styles.paragraph}>Addis Ababa, Ethiopia</Text>
            <Text style={styles.paragraph}>
              With Registered address: - Tel. +251-118-120-509, Pox. 16417
            </Text>
            <Text style={styles.paragraph}>E-mail: - vprtt@aastu.edu.et</Text>
          </View>
        </View>

        <Footer />
      </Page>

      {/* PAGE 2 */}
      <Page size="A4" style={styles.page}>
        <PageHeader page={2} total={8} data={data} />

        <View style={styles.contentWrapper}>
          <Text style={[styles.sectionTitle, styles.mb2]}>Preamble</Text>
          <Text style={[styles.sectionTitle, styles.mb2]}>ARTICLE-1</Text>
          <Text style={[styles.sectionTitle, styles.mb4]}>
            Internal Research fund, Scope and duration of the Research Project
          </Text>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>1.1.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              The Research Project Proposal and every section thereof shall
              constitute part and parcel of this Contractual Agreement.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>1.2.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              The approved amount of fund for the submitted internal research
              grant is Ethiopian Birr (ETB) {data.approved_budget || "_______"}{" "}
              ({data.approved_budget_words || "______________________"}) ETB
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>1.3.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              The duration of this internal research grant shall take a maximum
              of two years. The project may be extended for 6 months on request
              by the researcher with justification. The researcher shall submit
              request for extension to the office of VPRTT.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>1.4.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              The scope of the activity to be performed by the principal
              investigator.
            </Text>
          </View>

          <View style={styles.indent}>
            <View style={styles.listRow}>
              <Text style={styles.bullet}>1.4.1.</Text>
              <Text style={[styles.paragraph, { flex: 1 }]}>
                The principal investigator will be responsible for the
                successful completion of the research project.
              </Text>
            </View>
            <View style={styles.listRow}>
              <Text style={styles.bullet}>1.4.2.</Text>
              <Text style={[styles.paragraph, { flex: 1 }]}>
                The research project should be completed as per approved
                research grant proposal.
              </Text>
            </View>
            <View style={styles.listRow}>
              <Text style={styles.bullet}>1.4.3.</Text>
              <Text style={[styles.paragraph, { flex: 1 }]}>
                The research project should be completed in the time specified
                in the proposal.
              </Text>
            </View>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>1.5.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              In case of discrepancies between the terms of this agreement and
              those in the project proposal, the former shall prevail.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>1.6.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              Since it is considered as part and parcel of the contract, any
              minor or major modification of the terms of the original research
              proposal should be made with prior consultation of the Office of
              Vice President for Research and Technology Transfer.
            </Text>
          </View>
        </View>

        <Footer />
      </Page>

      {/* PAGE 3 */}
      <Page size="A4" style={styles.page}>
        <PageHeader page={3} total={8} data={data} />

        <View style={styles.contentWrapper}>
          <Text style={[styles.sectionTitle, styles.mb2]}>ARTICLE-2</Text>
          <Text style={[styles.sectionTitle, styles.mb4]}>
            2. Responsibilities of the Principal Investigator and Co-Principal
            Investigators
          </Text>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>2.1.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              Shall undertake the research project in accordance with the terms
              and conditions set forth in this agreement and as per the detailed
              Full Research Project Proposal submitted to Office of Research and
              Center of Excellence Directorate. Proper execution of every stated
              sentence thereof shall be considered the duties and
              responsibilities of the principal investigator and Co-Principal
              Investigator
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>2.2.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              Shall submit detailed technical and financial activity reports as
              per schedule of reporting in Article 6 of this Agreement.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>2.3.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              He/she shall be responsible for proper execution of the research
              project.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>2.4.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              As may be required by the Office of Research and Center of
              Excellence Directorate/ Office of Research and Technology Transfer
              Vice President Office, he/she shall provide any relevant
              information/data on the research project/and related activities in
              written forms.
            </Text>
          </View>

          <Text
            style={[styles.sectionTitle, { marginTop: 24, marginBottom: 8 }]}
          >
            ARTICLE-3
          </Text>
          <Text style={[styles.sectionTitle, styles.mb4]}>
            3. Responsibilities of Office of Vice President for Research and
            Technology Transfer (VPRTT Office)
          </Text>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>3.1.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              Shall provide the allocated budget for the project.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>3.2.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              Assigns competent experts of technical team (reviewer or
              evaluator) for regular follow up, monitoring and approval of
              research outputs and progresses of the research project.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>3.3.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              Based on its findings of the evaluation, VPRTT Office reserves the
              right to take any unilateral action on the progress of the project
              including suspending the project for a specified time up to
              termination of the project.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>3.4.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              Organizes, coordinates and directs the regular and extra ordinary
              meetings and visits of the Technical Team to supervise and monitor
              each Project, as required.
            </Text>
          </View>
        </View>

        <Footer />
      </Page>

      {/* PAGE 4 */}
      <Page size="A4" style={styles.page}>
        <PageHeader page={4} total={8} data={data} />

        <View style={styles.contentWrapper}>
          <View style={styles.listRow}>
            <Text style={styles.bullet}>3.5.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              Coordinates/Organizes/hosts national workshops/exhibitions for
              presentations, display and dissemination of the outcome and
              results of the Project as deemed necessary for the purpose of
              national interest.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>3.6.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              Shall take upon itself the responsibility of administering and
              ensuring the administration of the research Project Fund as per
              the standing rules and regulations of the government of Ethiopia.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>3.7.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              Shall be responsible to ensure that, and justify with proper legal
              documentation and product that:
            </Text>
          </View>

          <View style={styles.indent}>
            <View style={styles.listRow}>
              <Text style={styles.bullet}>3.7.1.</Text>
              <Text style={[styles.paragraph, { flex: 1 }]}>
                Fund disbursements are as per the Terms of this Agreement and
                the Project Proposal. In case of discrepancy between the two,
                the former shall prevail.
              </Text>
            </View>
            <View style={styles.listRow}>
              <Text style={styles.bullet}>3.7.2.</Text>
              <Text style={[styles.paragraph, { flex: 1 }]}>
                An appropriate and reliable financial system of internal control
                is maintained with respect to the prototype development Fund.
              </Text>
            </View>
            <View style={styles.listRow}>
              <Text style={styles.bullet}>3.7.3.</Text>
              <Text style={[styles.paragraph, { flex: 1 }]}>
                Financial activity reports are accurately presented and
                justified with support documentations.
              </Text>
            </View>
            <View style={styles.listRow}>
              <Text style={styles.bullet}>3.7.4.</Text>
              <Text style={[styles.paragraph, { flex: 1 }]}>
                The research Project progresses both technical and financial in
                every 6 months. The office VPRTT shall arrange Research Review
                Weeks where all researcher present their research outputs and
                reviewed accordingly.
              </Text>
            </View>
          </View>

          <Text
            style={[styles.sectionTitle, { marginTop: 24, marginBottom: 8 }]}
          >
            ARTICLE-4
          </Text>
          <Text style={[styles.sectionTitle, styles.mb4]}>
            4. Responsibilities of Host Center of Excellence
          </Text>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>4.1.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              Shall provide required physical facilities, laboratories,
              equipment and other related facilities used for the project.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>4.2.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              Shall monitor, administer and ensure the research fund as per the
              proposal, internal rules and regulation and rules and regulation
              of the government of Ethiopia.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>4.3.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              Shall approve and support procurement of research items based on
              the project proposal and as per the standing rules and regulations
              of the government of Ethiopia.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>4.4.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              Shall reports the progress of the project and the research out to
              the office of vice president for research and technology.
            </Text>
          </View>
        </View>

        <Footer />
      </Page>

      {/* PAGE 5 */}
      <Page size="A4" style={styles.page}>
        <PageHeader page={5} total={8} data={data} />

        <View style={styles.contentWrapper}>
          <Text style={[styles.sectionTitle, styles.mb2]}>ARTICLE-5</Text>
          <Text style={[styles.sectionTitle, styles.mb2]}>
            5. Schedule of Financial Disbursement
          </Text>

          <Text style={[styles.paragraph, styles.mb4]}>
            Disbursement of the research fund shall be as follows:
          </Text>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>5.1.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              After signing of this Contractual Agreement by all parties
              (Principal Investigator, host center of excellence and VPRTT
              office) the VPRTT office shall release the approved project fund
              indicating the project activities and the amount to be released
              from the transfer of the Fund.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>5.2.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              On successful completion of the research project, there might be
              an event where the project is presented in front of professionals
              and led to scale up, further application or external grant, or
              possible commercialization.
            </Text>
          </View>

          <Text style={[styles.sectionTitle, styles.mb2]}>ARTICLE-6</Text>
          <Text style={[styles.sectionTitle, styles.mb4]}>
            6. Schedule of Financial and Technical Reporting
          </Text>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>6.1.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              The principal investigator should submit complete technical and
              financial report to host center of excellence and the center of
              excellence shall approve the report and submit to the Office of
              VPRTT every six months. Failure to submit these reports shall
              constitute non-compliance to this Agreement as per Article 10 of
              this Agreement.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>6.2.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              Both Financial and Technical Reports to be submitted to office of
              VPRTT shall be progressive and cumulative of all the previously
              reported technical and financial activities.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>6.3.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              The final research project report shall be submitted to the Office
              VPRTT within one week after the expiry of the project period and
              the project shall be presented on the annual research review week.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>6.4.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              All reports shall be submitted in both hard and soft copies to the
              Office VPRTT.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>6.5.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              The Office of VPRTT may arrange presentation sessions for progress
              report for ongoing research projects and evaluation for completed
              research projects.
            </Text>
          </View>
        </View>

        <Footer />
      </Page>

      {/* PAGE 6 */}
      <Page size="A4" style={styles.page}>
        <PageHeader page={6} total={8} data={data} />

        <View style={styles.contentWrapper}>
          <Text style={[styles.sectionTitle, styles.mb2]}>ARTICLE-7</Text>
          <Text style={[styles.sectionTitle, styles.mb2]}>
            7. Expenses not to be covered by the Internal Research Fund
          </Text>

          <Text style={[styles.paragraph, styles.mb4]}>
            The Research Fund under this Contractual Agreement shall not be used
            for:
          </Text>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>7.1.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              Purchase of fixed assets like laptops and computers, external hard
              desks and pen drives (unless justified), internet services and
              mobile cards.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>7.2.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              Salaries for research assistant and or research time allowances of
              principal investigators, co-investigators, members and technical
              assistance.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>7.3.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              Any expenses not in line with the standing rules and regulations
              of the Ethiopian Government.
            </Text>
          </View>

          <Text style={[styles.sectionTitle, styles.mb2]}>ARTICLE-8</Text>
          <Text style={[styles.sectionTitle, styles.mb2]}>
            8. System and Schedule of Supervision
          </Text>

          <Text style={[styles.paragraph, styles.mb4]}>
            Without any prejudice to the provisions of article 3 of this
            agreement:
          </Text>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>8.1.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              The Office of VPRTT shall assign Technical Team of experts for the
              supervision and follow-up of the research development Project.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>8.2.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              The Respective Center of Excellence in consultation with the
              Office of the VPRTT shall take the responsibility of follow up of
              the project by assigning technical team; valuate the regular
              technical report and compatibility of the expenditure and present
              its recommendation on the progress of the project.
            </Text>
          </View>

          <Text style={[styles.sectionTitle, styles.mb2]}>ARTICLE-9</Text>
          <Text style={[styles.sectionTitle, styles.mb4]}>
            9. Intellectual Property Rights
          </Text>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>9.1.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              Any Proprietary findings in the form of Patents, Utility Models as
              a result of Inventions, Innovations, and new Models of any type
              resulted out of the project shall addressed by AASTU Intellectual
              Property Guideline.
            </Text>
          </View>
        </View>

        <Footer />
      </Page>

      {/* PAGE 7 */}
      <Page size="A4" style={styles.page}>
        <PageHeader page={7} total={8} data={data} />
        <View style={styles.contentWrapper}>
          <Text style={[styles.sectionTitle, styles.mb2]}>ARTICLE-10</Text>
          <Text style={[styles.sectionTitle, styles.mb4]}>
            10. Non-Compliance to Terms of Contractual Agreement
          </Text>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>10.1.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              Failure to adhere to each and every Term of this Agreement shall
              constitute non-compliance to the Agreement.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>10.2.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              In such cases, the VPRTT office or the host center of excellence
              could in writing initiate correction of the non-compliance by the
              defaulting party amicably.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>10.3.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              All necessary amicable and administrative efforts shall be
              exhaustively taken before considering further legal measures.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>10.4.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              If need be, legal measures shall be taken to ensure that the
              public money would be utilized for the intended purpose only.
            </Text>
          </View>

          <View style={styles.listRow}>
            <Text style={styles.bullet}>10.5.</Text>
            <Text style={[styles.paragraph, { flex: 1 }]}>
              Any breach of the terms of the contract and the legal liabilities
              of the parties arising thereof are governed by the standing rules
              of the nation.
            </Text>
          </View>

          <Text
            style={[styles.sectionTitle, { marginTop: 24, marginBottom: 8 }]}
          >
            ARTICLE-11
          </Text>
          <Text style={[styles.sectionTitle, styles.mb2]}>
            Revisions to Terms of Contractual Agreement
          </Text>

          <Text style={[styles.paragraph, styles.mb4]}>
            This agreement shall be revised and amended any time only when all
            the three parties agree on the Terms of the Revision and amendments.
          </Text>

          <Text style={[styles.sectionTitle, styles.mb2]}>ARTICLE 12</Text>
          <Text style={[styles.sectionTitle, styles.mb2]}>
            Effective Date of the Agreement
          </Text>

          <Text style={[styles.paragraph, styles.mb4]}>
            This Agreement shall be effective as of the date of signing by all
            parties and stamped by the official seal of AASTU and Principal
            Investigator.
          </Text>
        </View>
        <Footer />
      </Page>

      {/* PAGE 8 */}
      <Page size="A4" style={styles.page}>
        <PageHeader page={8} total={8} data={data} />

        <View style={styles.contentWrapper}>
          <Text style={{ marginTop: 10 }}>
            This Agreement is signed today on the <Text>{data.day}</Text> day of{" "}
            <Text>{data.month}</Text>, in Addis Ababa, Ethiopia
          </Text>

          <View style={{ marginTop: 20 }}>
            <Text>
              For and on behalf of Office of VPRTT/RCoED {"\t\t"}
              For and on behalf host center of excellence {"\t\t"}
              Principal Investigator
            </Text>

            <Text style={{ marginTop: 12 }}>
              Signature________________ {"\t\t"} Signature________________{" "}
              {"\t\t"} Signature________________
            </Text>

            <Text style={{ marginTop: 12 }}>
              Name________________ {"\t\t\t\t"} Name________________{" "}
              {"\t\t\t\t"} Name________________
            </Text>

            <Text style={{ marginTop: 12 }}>
              Date________________ {"\t\t\t\t"} Date________________{" "}
              {"\t\t\t\t"} Date________________
            </Text>
          </View>

          <View style={{ marginTop: 12 }}>
            <Text style={styles.bold}>Members</Text>
            <View style={{ marginTop: 16 }}>
              <Text>Member 1</Text>
              <Text>
                Signature________________ Name________________
                Date________________
              </Text>
            </View>
            <View style={{ marginTop: 12 }}>
              <Text>Member 2</Text>
              <Text>
                Signature________________ Name________________
                Date________________
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 48 }}>
            <Text style={[styles.bold, { marginBottom: 12 }]}>Witnesses</Text>
            <View style={{ flexDirection: "row", gap: 120 }}>
              <Text>{"     "}Name</Text>
              <Text>{"     "}Signature</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Text>1.</Text>
              <Text><Text style={{ flex: 1 }}>_______________________</Text> <Text style={{ flex: 1 }}>_______________________</Text></Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Text>2.</Text>
              <Text><Text style={{ flex: 1 }}>_______________________</Text> <Text style={{ flex: 1 }}>_______________________</Text></Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Text>3.</Text>
              <Text><Text style={{ flex: 1 }}>_______________________</Text> <Text style={{ flex: 1 }}>_______________________</Text></Text>
            </View>
          </View>
        </View>

        <Footer />
      </Page>
    </Document>
  );
};

export default ContractDocumentPDF;
