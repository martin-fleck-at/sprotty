/********************************************************************************
 * Copyright (c) 2018 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { Point, Bounds, center, almostEquals, PointToPointLine, Diamond, shiftTowards, intersection } from './geometry';

export function computeCircleAnchor(position: Point, radius: number, refPoint: Point, offset: number = 0): Point {
    const cx = position.x + radius;
    const cy = position.y + radius;
    const dx = cx - refPoint.x;
    const dy = cy - refPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const normX = (dx / distance) || 0;
    const normY = (dy / distance) || 0;
    return {
        x: cx - normX * (radius + offset),
        y: cy - normY * (radius + offset)
    };
}

function getXIntersection(yIntersection: number, centerPoint: Point, point: Point): number {
    const t = (yIntersection - centerPoint.y) / (point.y - centerPoint.y);
    return (point.x - centerPoint.x) * t + centerPoint.x;
}

function getYIntersection(xIntersection: number, centerPoint: Point, point: Point): number {
    const t = (xIntersection - centerPoint.x) / (point.x - centerPoint.x);
    return (point.y - centerPoint.y) * t + centerPoint.y;
}

class NearestPointFinder {
    protected currentBest: Point | undefined;
    protected currentDist: number = -1;

    constructor(protected centerPoint: Point, protected refPoint: Point) {
    }

    addCandidate(x: number, y: number) {
        const dx = this.refPoint.x - x;
        const dy = this.refPoint.y - y;
        const dist = dx * dx + dy * dy;
        if (this.currentDist < 0 || dist < this.currentDist) {
            this.currentBest = {
                x: x,
                y: y
            };
            this.currentDist = dist;
        }
    }

    get best(): Point {
        if (this.currentBest === undefined)
            return this.centerPoint;
        else
            return this.currentBest;
    }
}

export function computeRectangleAnchor(bounds: Bounds, refPoint: Point, offset: number): Point {
    const c = center(bounds);
    const finder = new NearestPointFinder(c, refPoint);
    if (!almostEquals(c.y, refPoint.y)) {
        const xTop = getXIntersection(bounds.y, c, refPoint);
        if (xTop >= bounds.x && xTop <= bounds.x + bounds.width)
            finder.addCandidate(xTop, bounds.y - offset);
        const xBottom = getXIntersection(bounds.y + bounds.height, c, refPoint);
        if (xBottom >= bounds.x && xBottom <= bounds.x + bounds.width)
            finder.addCandidate(xBottom, bounds.y + bounds.height + offset);
    }
    if (!almostEquals(c.x, refPoint.x)) {
        const yLeft = getYIntersection(bounds.x, c, refPoint);
        if (yLeft >= bounds.y && yLeft <= bounds.y + bounds.height)
            finder.addCandidate(bounds.x - offset, yLeft);
        const yRight = getYIntersection(bounds.x + bounds.width, c, refPoint);
        if (yRight >= bounds.y && yRight <= bounds.y + bounds.height)
            finder.addCandidate(bounds.x + bounds.width + offset, yRight);
    }
    return finder.best;
}

export function computeDiamondAnchor(bounds: Bounds, refPoint: Point, offset: number): Point {
    const referenceLine = new PointToPointLine(center(bounds), refPoint);
    const closestDiamondSide = new Diamond(bounds).closestSideLine(refPoint);
    const anchorPoint = intersection(closestDiamondSide, referenceLine);
    return shiftTowards(anchorPoint, refPoint, offset);
}
