<template>
    <div class="cat-cont multi-action green lighten-3 my-2">
        <!-- Manage manga categories -->
        <v-layout row>
            <v-flex xs12 class="header-container">
                <div class="cat-chip grey">
                    <span class="cat-badge">
                        {{ i18n("list_multi_action_currently_selected", this.selectedMangasCount()) }}
                    </span>
                </div>
                <template v-if="this.selectedMangasCount() === 0">
                    <h3 class="flex">{{ i18n("list_multi_action_select_manga") }}</h3>
                </template>
                <template v-else>
                    <v-tooltip top content-class="icon-ttip">
                        <v-icon class="flex" slot="activator" @click.native="clearSelect()">
                            mdi-close
                        </v-icon>
                        <span>{{ i18n("button_clear") }}</span>
                    </v-tooltip>
                </template>
            </v-flex>
        </v-layout>
        <v-layout v-if="this.selectedMangasCount() > 0" row>
            <v-flex xs12 class="amr-categories">
                <div class="det-sel-wrapper">
                    <select v-model="selectedCategory" class="green lighten-1">
                        <option value="">
                            {{ i18n("list_multi_action_select_category") }}
                        </option>
                        <option v-for="(cat, key) of categories" :key="key"
                                :value="cat.name">
                            {{ cat.name }}
                        </option>
                    </select>
                </div>
                <!-- Actions buttons -->
                <div v-if="selectedCategory" class="amr-actions">
                    <v-btn dark @click='addCategory()' class="green" small>
                        {{ i18n("button_add") }}
                    </v-btn>
                    <v-btn dark @click='deleteCategory()' class="green" small>
                        {{ i18n("button_remove") }}
                    </v-btn>
                </div>
            </v-flex>
        </v-layout>
    </div>
</template>

<script>
import i18n from '../../amr/i18n';
import * as utils from '../utils';
import { mapGetters } from 'vuex';
import Categories from './Categories';

export default {
  name: "MultiMangaAction",
  components: { Categories },
  data() {
    return {
      selectedCategory: "",
    }
  },
  computed: {
    // AMR options
    options: function() {
      return this.$store.state.options;
    },
    categories: function() {
      return this.options.categoriesStates.filter(cat => cat.type !== 'native' && cat.type !== 'language');
    },
  },
  methods: {
    i18n: (message, ...args) => i18n(message, ...args),
    convertIcons: str => utils.convertIcons(str),
    addCategory: function() {
      for (let key of this.selectedMangasKeys()) {
        this.$store.dispatch("addCategoryToManga", {
          key: key,
          name: this.selectedCategory
        });
      }
      this.selectedCategory = "";
    },
    /**
     * Delete a category on this group of manga
     */
    deleteCategory: function() {
      for (let key of this.selectedMangasKeys()) {
        this.$store.dispatch("removeCategoryFromManga", {
          key: key,
          name: this.selectedCategory
        });
      }
      this.selectedCategory = "";
    },
    clearSelect: function () {
      this.$store.dispatch("clearMangasSelect");
    },
    ...mapGetters(["selectedMangasCount", "selectedMangasKeys"])
  },
}
</script>

<style scoped>

.multi-action {
    min-height: 80px;
}

.header-container {
    font-size : 1.5rem;
}

.header-container .v-icon {
    font-size : 1.5rem;
    cursor: pointer;

}
.det-sel-wrapper {
    display  : inline-block;
    position : relative;
}

.amr-categories {
    display: flex;
    align-items: center;
}

.selected-header {
    font-size : 1rem;
}

select {
    display       : flex;
    outline       : none;
    border-style  : none;
    border-radius : 2px !important;
    position      : relative;
    padding       : 2px 16px 2px 4px;
    margin        : 6px 0;
    color         : white;
    font-size     : 1.5rem;
}

.det-sel-wrapper:after {
    content        : "▼";
    position       : absolute;
    top            : 0;
    right          : 0;
    bottom         : 0;
    line-height    : 36px;
    padding        : 2px;
    pointer-events : none;
    z-index        : 1;
}

</style>
