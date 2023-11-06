<script lang="ts">
import { defineComponent, h, resolveDirective, withDirectives } from "vue";

export default defineComponent({
	props: {
		modelValue: {
			required: true,
		},
		style: {
			required: false,
		},
	},
	render() {
		const options = this.$slots.default();

		return h(
			"div",
			{
				class: [
					"pxhvhrfw",
					{ chips: this.style === "chips" },
					{ underline: this.style === "underline" },
				],
				role: "tablist",
			},
			options.map((option) =>
				withDirectives(
					h(
						"button",
						{
							class: "_button",
							role: "tab",
							key: option.key,
							"aria-selected":
								this.modelValue === option.props?.value
									? "true"
									: "false",
							onClick: () => {
								this.$emit(
									"update:modelValue",
									option.props?.value,
								);
							},
						},
						option.children,
					),
					[[resolveDirective("click-anime")]],
				),
			),
		);
	},
});
</script>

<style lang="scss">
.pxhvhrfw {
	display: flex;
	font-size: 90%;
	border-radius: var(--radius);
	padding: 10px 8px;

	> button {
		flex: 1;
		padding: 10px 8px;
		margin: 0 8px;
		border-radius: var(--radius);

		&:disabled {
			opacity: 1 !important;
			cursor: default;
		}

		&[aria-selected="true"] {
			color: var(--accent);
			background: var(--accentedBg) !important;
		}

		&:not([aria-selected="true"]):hover {
			color: var(--fgHighlighted);
			background: var(--panelHighlight);
		}

		&:not(:first-child) {
			margin-left: 8px;
		}

		> .icon {
			margin-right: 6px;
		}

		&:empty {
			display: none !important;
		}
	}

	&.chips,
	&.underline {
		padding: 12px 32px;
		font-size: 0.85em;
		overflow-x: auto;
		mask: linear-gradient(to right, black calc(100% - 90px), transparent);
		-webkit-mask: linear-gradient(
			to right,
			black calc(100% - 90px),
			transparent
		);
		padding-right: 90px !important;
		white-space: nowrap;

		&::-webkit-scrollbar {
			display: none;
		}
		> button {
			display: flex;
			gap: 6px;
			align-items: center;
			flex: unset;
			margin: 0;
			margin-right: 8px;
			padding: 0.5em 1em;
			border-radius: 100px;
			background: var(--buttonBg);
			> i {
				margin-top: -0.1em;
			}
			> .count {
				margin-right: -0.2em;
			}
		}
	}

	&.underline {
		padding-block: 0 !important;
		margin-bottom: -1px;
		border-radius: 0;
		button {
			background: none !important;
			border-radius: 0 !important;
			padding-block: 10px !important;
			border-bottom: 2px solid transparent;
			&[aria-selected="true"] {
				background: none !important;
				font-weight: 700;
				border-bottom-color: var(--accent);
			}
		}
	}

	&.max-width_500px {
		font-size: 80%;

		> button {
			padding: 11px 8px;
		}
	}
}
</style>
