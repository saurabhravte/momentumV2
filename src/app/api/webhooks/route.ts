import { processWebhook } from 'corsair';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { corsair } from '@/server/corsair';
import { inngest } from '@/inngest/client';

export async function POST(request: NextRequest) {
	const headers: Record<string, string> = {};
	request.headers.forEach((value, key) => {
		headers[key] = value;
	});

	const contentType = request.headers.get('content-type');

	let body: string | Record<string, unknown>;

	if (contentType?.includes('application/json')) {
		body = await request.json();
	} else {
		const text = await request.text();
		body = text && text.trim() ? text : {};
	}

	const tenantId = 'dev'

	const result = await processWebhook(corsair, headers, body, { tenantId });

	console.info('Plugin Processed:', result.plugin, result.action);

	// Real-time AI triage: when Corsair caches a new Gmail message, hand it off
	// to Inngest (off the request path) for cheap LLM priority classification.
	try {
		if (result.plugin === 'gmail' && typeof body === 'object') {
			const data = body as Record<string, any>;
			const msg = data.message ?? data.data ?? data;
			await inngest.send({
				name: 'gmail/message.received',
				data: {
					messageId: String(msg.id ?? msg.messageId ?? ''),
					subject: String(msg.subject ?? msg.data?.subject ?? ''),
					from: String(msg.from ?? msg.data?.from ?? ''),
					snippet: String(msg.snippet ?? msg.data?.snippet ?? ''),
				},
			});
		}
	} catch (err) {
		console.warn('Inngest dispatch failed (non-fatal):', err);
	}

	// Build response headers (e.g. Asana X-Hook-Secret handshake)
	// any/unknown cast needed since responseHeaders is a newer field not yet in the installed type definitions
	const responseHeaders = result.responseHeaders
	const nextHeaders = new Headers();
	if (responseHeaders) {
		for (const [key, value] of Object.entries(responseHeaders)) {
			nextHeaders.set(key, value);
		}
	}

	// Handle case where no webhook matched
	if (!result.response) {
		return NextResponse.json(
			{
				success: false,
				message: 'No matching webhook handler found',
			},
			{ status: 404 },
		);
	}

	if (result.response !== undefined) {
		return NextResponse.json(result.response, { headers: nextHeaders });
	}

	// Webhook processed successfully, but no data to return to sender
	return new NextResponse(null, { status: 200, headers: nextHeaders });
}

export async function GET() {
	return NextResponse.json({
		status: 'ok',
		message: 'Webhook endpoint is active',
		timestamp: new Date().toISOString(),
	});
}
