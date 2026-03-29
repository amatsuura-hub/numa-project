package model

import "testing"

func TestCalcNumaLevel(t *testing.T) {
	tests := []struct {
		name      string
		completed int
		total     int
		want      int
	}{
		// Edge cases
		{"zero total", 0, 0, 0},
		{"zero completed", 0, 10, 0},
		{"both zero", 0, 0, 0},

		// Level 0 → 1 boundary (1%)
		{"1 of 100 → Lv1", 1, 100, 1},
		{"1 of 5 → Lv1 (20%)", 1, 5, 1},

		// Level 1 → 2 boundary (21%)
		{"20 of 100 → Lv1", 20, 100, 1},
		{"21 of 100 → Lv2", 21, 100, 2},

		// Level 2 → 3 boundary (41%)
		{"40 of 100 → Lv2", 40, 100, 2},
		{"41 of 100 → Lv3", 41, 100, 3},

		// Level 3 → 4 boundary (61%)
		{"60 of 100 → Lv3", 60, 100, 3},
		{"61 of 100 → Lv4", 61, 100, 4},

		// Level 4 → 5 boundary (81%)
		{"80 of 100 → Lv4", 80, 100, 4},
		{"81 of 100 → Lv5", 81, 100, 5},

		// 100%
		{"100 of 100 → Lv5", 100, 100, 5},

		// Integer division: 1/5 = 20%, should be Lv1
		{"integer div 1/5", 1, 5, 1},
		// 2/5 = 40%, should be Lv2
		{"integer div 2/5", 2, 5, 2},
		// 3/5 = 60%, should be Lv3
		{"integer div 3/5", 3, 5, 3},
		// 4/5 = 80%, should be Lv4
		{"integer div 4/5", 4, 5, 4},
		// 5/5 = 100%, should be Lv5
		{"integer div 5/5", 5, 5, 5},

		// Small total: 1 of 1 = 100%
		{"1 of 1 → Lv5", 1, 1, 5},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := CalcNumaLevel(tt.completed, tt.total)
			if got != tt.want {
				t.Errorf("CalcNumaLevel(%d, %d) = %d, want %d", tt.completed, tt.total, got, tt.want)
			}
		})
	}
}
