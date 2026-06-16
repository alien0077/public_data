return {
  {
    "akinsho/bufferline.nvim",
    enabled = false,
  },

  {
    "nvim-lualine/lualine.nvim",
    opts = function(_, opts)
      local colors = {
        normal = { bg = "#7c3aed", fg = "#ffffff" },
        insert = { bg = "#ffffff", fg = "#1e1e2e" },
        visual = { bg = "#f59e0b", fg = "#1e1e2e" },
        replace = { bg = "#ef4444", fg = "#ffffff" },
        command = { bg = "#10b981", fg = "#ffffff" },
        inactive = { bg = "#313244", fg = "#6c7086" },
      }

      opts.options = {
        theme = {
          normal = {
            a = { bg = colors.normal.bg, fg = colors.normal.fg, gui = "bold" },
            b = { bg = "#45475a", fg = "#cdd6f4" },
            c = { bg = "#313244", fg = "#a6adc8" },
          },
          insert = {
            a = { bg = colors.insert.bg, fg = colors.insert.fg, gui = "bold" },
            b = { bg = "#45475a", fg = "#cdd6f4" },
          },
          visual = {
            a = { bg = colors.visual.bg, fg = colors.visual.fg, gui = "bold" },
            b = { bg = "#45475a", fg = "#cdd6f4" },
          },
          replace = {
            a = { bg = colors.replace.bg, fg = colors.replace.fg, gui = "bold" },
            b = { bg = "#45475a", fg = "#cdd6f4" },
          },
          command = {
            a = { bg = colors.command.bg, fg = colors.command.fg, gui = "bold" },
            b = { bg = "#45475a", fg = "#cdd6f4" },
          },
          inactive = {
            a = { bg = colors.inactive.bg, fg = colors.inactive.fg },
            b = { bg = colors.inactive.bg, fg = colors.inactive.fg },
            c = { bg = colors.inactive.bg, fg = colors.inactive.fg },
          },
        },
        globalstatus = true,
        section_separators = { left = "", right = "" },
        component_separators = { left = "", right = "" },
        disabled_filetypes = { statusline = { "dashboard", "alpha", "ministarter", "snacks_dashboard" } },
      }

      vim.o.showtabline = 2

      opts.tabline = {
        lualine_a = { "mode" },
        lualine_b = {
          {
            "buffers",
            buffers_color = {
              active = { bg = "#45475a", fg = "#cdd6f4", gui = "bold" },
              inactive = { bg = "#313244", fg = "#6c7086" },
            },
            tab_max_length = 20,
            max_length = 0,
            mode = 2,
            path = 0,
            symbols = { modified = " ●", alternate_file = "", directory = "" },
          },
        },
        lualine_c = {
          { "branch", icon = "" },
          {
            "diff",
            symbols = { added = "+", modified = "~", removed = "-" },
            source = function()
              local gitsigns = vim.b.gitsigns_status_dict
              if gitsigns then
                return {
                  added = gitsigns.added,
                  modified = gitsigns.changed,
                  removed = gitsigns.removed,
                }
              end
            end,
          },
        },
        lualine_x = {
          { "filetype", icon_only = true, separator = "", padding = { left = 1, right = 0 } },
          "filename",
        },
        lualine_y = { "encoding", "fileformat" },
        lualine_z = { "progress", "location" },
      }

      opts.sections = {}
      opts.inactive_sections = {}
      opts.extensions = { "neo-tree", "lazy", "fzf" }
    end,
  },
}
