/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import {coalesce} from 'vs/base/common/arrays';
import {onUnexpectedError} from 'vs/base/common/errors';
import {TPromise} from 'vs/base/common/winjs.base';
import {IReadOnlyModel, IEditorPosition} from 'vs/editor/common/editorCommon';
import {CommonEditorRegistry} from 'vs/editor/common/editorCommonExtensions';
import {Hover, HoverProviderRegistry} from 'vs/editor/common/modes';
import {CancellationToken} from 'vs/base/common/cancellation';
import {toThenable} from 'vs/base/common/async';

export function provideHover(model: IReadOnlyModel, position: IEditorPosition, cancellationToken = CancellationToken.None): Thenable<Hover[]> {

	const supports = HoverProviderRegistry.ordered(model);
	const values: Hover[] = [];

	const promises = supports.map((support, idx) => {
		return toThenable(support.provideHover(model, position, cancellationToken)).then(result => {
			if (result) {
				let hasRange = (typeof result.range !== 'undefined');
				let hasHtmlContent = (typeof result.htmlContent !== 'undefined' && result.htmlContent && result.htmlContent.length > 0);
				if (hasRange && hasHtmlContent) {
					values[idx]  = result;
				}
			}
		}, err => {
			onUnexpectedError(err);
		});
	});

	return TPromise.join(promises).then(() => coalesce(values));
}

CommonEditorRegistry.registerDefaultLanguageCommand('_executeHoverProvider', provideHover);