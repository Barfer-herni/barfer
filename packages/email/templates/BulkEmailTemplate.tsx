import {
    Body,
    Container,
    Head,
    Hr,
    Html,
    Img,
    Preview,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';
import { format } from 'date-fns';

interface BulkEmailTemplateProps {
    clientName: string;
    content: string;
}

export const BulkEmailTemplate = ({
    clientName,
    content,
}: BulkEmailTemplateProps) => {
    // Reemplaza el placeholder {nombre} y los saltos de línea por <br />
    const personalizedContent = content
        .replace(/\{nombre\}/g, clientName)
        .replace(/\n/g, '<br />');

    return (
        <Html>
            <Head />
            <Preview>Un mensaje de Barfer</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Text style={paragraph}>Hola {clientName},</Text>
                    {/* Renderiza el contenido HTML del mensaje */}
                    <div dangerouslySetInnerHTML={{ __html: personalizedContent }} />
                    <Hr style={hr} />
                    <Text style={footer}>
                        Barfer - {format(new Date(), 'yyyy')}
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

export default BulkEmailTemplate;

const main = {
    backgroundColor: '#ffffff',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
};

const logoContainer = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '120px',
    margin: '0 auto',
};

const paragraph = {
    fontSize: '16px',
    lineHeight: '26px',
};

const hr = {
    borderColor: '#cccccc',
    margin: '20px 0',
};

const footer = {
    color: '#8898aa',
    fontSize: '12px',
}; 