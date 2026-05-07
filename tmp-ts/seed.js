"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var index_js_1 = require("../generated/prisma/index.js");
var prisma = new index_js_1.PrismaClient();
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data, _i, _a, m, movie, _b, _c;
    var _d, _e, _f, _g;
    var _h, _j, _k, _l, _m, _o, _p;
    return __generator(this, function (_q) {
        switch (_q.label) {
            case 0:
                data = JSON.parse(fs_1.default.readFileSync('./data.json', 'utf8'));
                return [4 /*yield*/, prisma.$transaction([
                        prisma.movieGenre.deleteMany(),
                        prisma.movieRelease.deleteMany(),
                        prisma.genre.deleteMany(),
                        prisma.movie.deleteMany(),
                    ])];
            case 1:
                _q.sent();
                console.log('✅ Đã xóa dữ liệu cũ.');
                console.log('🎭 Seed genres...');
                return [4 /*yield*/, prisma.$transaction(data.genres.map(function (g) {
                        return prisma.genre.create({
                            data: { name: g.name },
                        });
                    }))];
            case 2:
                _q.sent();
                console.log("\u2705 \u0110\u00E3 seed ".concat(data.genres.length, " th\u1EC3 lo\u1EA1i."));
                _i = 0, _a = data.movies;
                _q.label = 3;
            case 3:
                if (!(_i < _a.length)) return [3 /*break*/, 8];
                m = _a[_i];
                _c = (_b = prisma.movie).create;
                _d = {};
                _e = {
                    title: m.title,
                    originalTitle: (_h = m.original_title) !== null && _h !== void 0 ? _h : m.title,
                    overview: (_j = m.overview) !== null && _j !== void 0 ? _j : '',
                    posterUrl: m.poster_path,
                    trailerUrl: (_k = m.trailerUrl) !== null && _k !== void 0 ? _k : '',
                    backdropUrl: m.backdrop_path
                        ? "https://image.tmdb.org/t/p/original".concat(m.backdrop_path)
                        : '',
                    runtime: (_l = m.runtime) !== null && _l !== void 0 ? _l : 120,
                    releaseDate: new Date(m.release_date),
                    ageRating: index_js_1.AgeRating.P,
                    originalLanguage: (_m = m.original_language) !== null && _m !== void 0 ? _m : 'en',
                    spokenLanguages: [(_o = m.original_language) !== null && _o !== void 0 ? _o : 'en'],
                    productionCountry: m.production_countries,
                    languageType: index_js_1.LanguageOption.SUBTITLE,
                    director: (_p = m.director) !== null && _p !== void 0 ? _p : 'Unknown',
                    cast: m.cast
                };
                _f = {};
                return [4 /*yield*/, Promise.all((m.release_dates || []).map(function (r) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, {
                                    startDate: new Date(r),
                                }];
                        });
                    }); }))];
            case 4:
                _e.movieReleases = (_f.create = _q.sent(),
                    _f);
                _g = {};
                return [4 /*yield*/, Promise.all((m.genres || []).map(function (g) { return __awaiter(void 0, void 0, void 0, function () {
                        var genreName, genre;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    genreName = getGenreNameById(g.id);
                                    return [4 /*yield*/, prisma.genre.findFirst({
                                            where: { name: genreName },
                                        })];
                                case 1:
                                    genre = _a.sent();
                                    if (!!genre) return [3 /*break*/, 3];
                                    return [4 /*yield*/, prisma.genre.create({
                                            data: { name: genreName },
                                        })];
                                case 2:
                                    genre = _a.sent();
                                    _a.label = 3;
                                case 3: return [2 /*return*/, { genreId: genre.id }];
                            }
                        });
                    }); }))];
            case 5: return [4 /*yield*/, _c.apply(_b, [(_d.data = (_e.movieGenres = (_g.create = _q.sent(),
                        _g),
                        _e),
                        _d)])];
            case 6:
                movie = _q.sent();
                console.log("\uD83C\uDFAC Seeded movie: ".concat(movie.title));
                _q.label = 7;
            case 7:
                _i++;
                return [3 /*break*/, 3];
            case 8:
                console.log('🌟 Seed hoàn tất!');
                return [2 /*return*/];
        }
    });
}); };
function getGenreNameById(id) {
    var map = {
        28: 'Phim Hành Động',
        12: 'Phim Phiêu Lưu',
        16: 'Phim Hoạt Hình',
        35: 'Phim Hài',
        80: 'Phim Hình Sự',
        99: 'Phim Tài Liệu',
        18: 'Phim Chính Kịch',
        10751: 'Phim Gia Đình',
        14: 'Phim Giả Tượng',
        36: 'Phim Lịch Sử',
        27: 'Phim Kinh Dị',
        10402: 'Phim Nhạc',
        9648: 'Phim Bí Ẩn',
        10749: 'Phim Lãng Mạn',
        878: 'Phim Khoa Học Viễn Tưởng',
        10770: 'Chương Trình Truyền Hình',
        53: 'Phim Gây Cấn',
        10752: 'Phim Chiến Tranh',
        37: 'Phim Miền Tây',
    };
    return map[id] || 'Unknown';
}
main()
    .then(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log('🎉 Hoàn tất seed database.');
                return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); })
    .catch(function (e) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.error('❌ Lỗi seed:', e);
                return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                process.exit(1);
                return [2 /*return*/];
        }
    });
}); });
